const supabase = require('../config/supabase');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { Readable } = require('stream');

/**
 * Bulk import products/variants from CSV
 */
const bulkImport = async (req, res) => {
  try {
    const { fileContent, importType = 'both' } = req.body; // 'products', 'variants', 'both'

    if (!fileContent) {
      return res.status(400).json({ message: 'File content is required' });
    }

    // Parse CSV
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid CSV format', error: parseError.message });
    }

    const errors = [];
    const successful = [];
    const adminUserId = req.user.userId;

    // Create import log
    const { data: importLog } = await supabase
      .from('bulk_import_logs')
      .insert({
        admin_user_id: adminUserId,
        import_type: importType,
        file_name: 'upload.csv',
        total_rows: records.length,
        status: 'processing'
      })
      .select()
      .single();

    // Process records
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, arrays are 0-indexed

      try {
        if (importType === 'products' || importType === 'both') {
          // Import product
          if (!row.name || !row.category || !row.base_price) {
            errors.push({
              row: rowNumber,
              message: 'Missing required fields: name, category, base_price'
            });
            continue;
          }

          const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
              name: row.name,
              description: row.description || null,
              short_description: row.short_description || null,
              category: row.category,
              metal_type: row.metal_type || null,
              purity: row.purity || null,
              karat: row.karat ? parseInt(row.karat) : null,
              base_price: parseFloat(row.base_price),
              price: parseFloat(row.base_price),
              is_active: row.is_active !== 'false',
              is_bestseller: row.is_bestseller === 'true'
            })
            .select()
            .single();

          if (productError) {
            errors.push({
              row: rowNumber,
              message: `Error creating product: ${productError.message}`
            });
            continue;
          }

          successful.push({ row: rowNumber, type: 'product', id: product.id });

          // If importType is 'both', also import variants for this product
          if (importType === 'both' && row.size) {
            const { error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: product.id,
                size: row.size || null,
                color: row.color || null,
                finish: row.finish || null,
                weight: row.weight ? parseFloat(row.weight) : null,
                stock_quantity: parseInt(row.stock_quantity || 0),
                sku: row.sku || null,
                price_override: row.price_override ? parseFloat(row.price_override) : null,
                is_active: row.is_active !== 'false'
              });

            if (variantError) {
              errors.push({
                row: rowNumber,
                message: `Product created but variant failed: ${variantError.message}`
              });
            } else {
              successful.push({ row: rowNumber, type: 'variant', product_id: product.id });
            }
          }
        } else if (importType === 'variants') {
          // Import variant only (requires product_id)
          if (!row.product_id || !row.size) {
            errors.push({
              row: rowNumber,
              message: 'Missing required fields: product_id, size'
            });
            continue;
          }

          const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: row.product_id,
              size: row.size || null,
              color: row.color || null,
              finish: row.finish || null,
              weight: row.weight ? parseFloat(row.weight) : null,
              stock_quantity: parseInt(row.stock_quantity || 0),
              sku: row.sku || null,
              price_override: row.price_override ? parseFloat(row.price_override) : null,
              is_active: row.is_active !== 'false'
            });

          if (variantError) {
            errors.push({
              row: rowNumber,
              message: `Error creating variant: ${variantError.message}`
            });
            continue;
          }

          successful.push({ row: rowNumber, type: 'variant' });
        }
      } catch (rowError) {
        errors.push({
          row: rowNumber,
          message: `Unexpected error: ${rowError.message}`
        });
      }
    }

    // Update import log
    await supabase
      .from('bulk_import_logs')
      .update({
        successful_rows: successful.length,
        failed_rows: errors.length,
        errors: errors,
        status: errors.length === records.length ? 'failed' : 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', importLog.id);

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: adminUserId,
      action: 'bulk_import',
      entity_type: 'products',
      new_values: {
        import_type: importType,
        total_rows: records.length,
        successful: successful.length,
        failed: errors.length
      }
    });

    res.json({
      message: 'Bulk import completed',
      total: records.length,
      successful: successful.length,
      failed: errors.length,
      errors: errors.slice(0, 50), // Limit errors to first 50
      import_log_id: importLog.id
    });
  } catch (error) {
    console.error('Error in bulkImport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Bulk export products/variants to CSV
 */
const bulkExport = async (req, res) => {
  try {
    const { exportType = 'both' } = req.query; // 'products', 'variants', 'both'

    let csvData = [];

    if (exportType === 'products' || exportType === 'both') {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (exportType === 'products') {
        csvData = products || [];
      } else {
        // Export both - include products with their variants
        const { data: variants } = await supabase
          .from('product_variants')
          .select('*')
          .order('product_id', { ascending: true });

        // Combine products and variants
        csvData = (products || []).map(product => {
          const productVariants = (variants || []).filter(v => v.product_id === product.id);
          if (productVariants.length === 0) {
            return { ...product, size: null, color: null, finish: null, weight: null, stock_quantity: null, sku: null, price_override: null };
          }
          return productVariants.map(v => ({
            ...product,
            size: v.size,
            color: v.color,
            finish: v.finish,
            weight: v.weight,
            stock_quantity: v.stock_quantity,
            sku: v.sku,
            price_override: v.price_override
          }));
        }).flat();
      }
    } else if (exportType === 'variants') {
      const { data: variants } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(*)
        `)
        .order('product_id', { ascending: true });

      csvData = variants || [];
    }

    // Convert to CSV
    const csv = stringify(csvData, {
      header: true
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error in bulkExport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  bulkImport,
  bulkExport,
};

