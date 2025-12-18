const supabase = require('../config/supabase');

/**
 * Get all delivery zones with filters
 * GET /api/admin/delivery-zones
 */
const getAllDeliveryZones = async (req, res) => {
  try {
    const { pincode, category, product_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('delivery_zones')
      .select(`
        *,
        product:products!product_id (
          id,
          name,
          sku
        )
      `, { count: 'exact' })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (pincode) {
      query = query.ilike('pincode', `%${pincode}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching delivery zones:', error);
      return res.status(500).json({ message: 'Error fetching delivery zones' });
    }

    res.json({
      zones: data || [],
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error in getAllDeliveryZones:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get delivery zone by ID
 * GET /api/admin/delivery-zones/:id
 */
const getDeliveryZoneById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .select(`
        *,
        product:products!product_id (
          id,
          name,
          sku
        )
      `)
      .eq('id', id)
      .single();

    if (error || !zone) {
      return res.status(404).json({ message: 'Delivery zone not found' });
    }

    res.json(zone);
  } catch (error) {
    console.error('Error in getDeliveryZoneById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create delivery zone
 * POST /api/admin/delivery-zones
 */
const createDeliveryZone = async (req, res) => {
  try {
    const {
      pincode,
      city,
      state,
      delivery_days,
      shipping_charge,
      is_available,
      category,
      product_id,
      metal_type,
      priority,
      notes
    } = req.body;

    if (!pincode || !city || !state || !delivery_days) {
      return res.status(400).json({ 
        message: 'Pincode, city, state, and delivery_days are required' 
      });
    }

    // Validate pincode format (6 digits for India)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Pincode must be 6 digits' });
    }

    // Check for duplicate (pincode + product_id/category/metal_type combination)
    let duplicateQuery = supabase
      .from('delivery_zones')
      .select('id')
      .eq('pincode', pincode);

    if (product_id) {
      duplicateQuery = duplicateQuery.eq('product_id', product_id);
    } else {
      duplicateQuery = duplicateQuery.is('product_id', null);
    }

    if (category) {
      duplicateQuery = duplicateQuery.eq('category', category);
    } else {
      duplicateQuery = duplicateQuery.is('category', null);
    }

    if (metal_type) {
      duplicateQuery = duplicateQuery.eq('metal_type', metal_type);
    } else {
      duplicateQuery = duplicateQuery.is('metal_type', null);
    }

    const { data: existing } = await duplicateQuery;

    if (existing && existing.length > 0) {
      return res.status(400).json({ 
        message: 'A delivery zone with this combination already exists' 
      });
    }

    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .insert({
        pincode,
        city,
        state,
        delivery_days: parseInt(delivery_days),
        shipping_charge: parseFloat(shipping_charge || 0),
        is_available: is_available !== undefined ? is_available : true,
        category: category || null,
        product_id: product_id || null,
        metal_type: metal_type || null,
        priority: priority ? parseInt(priority) : 0,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating delivery zone:', error);
      return res.status(500).json({ message: 'Error creating delivery zone' });
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: req.user.userId,
        action: 'delivery_zone_created',
        entity_type: 'delivery_zone',
        entity_id: zone.id,
        new_values: { pincode, city, delivery_days },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.status(201).json(zone);
  } catch (error) {
    console.error('Error in createDeliveryZone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update delivery zone
 * PUT /api/admin/delivery-zones/:id
 */
const updateDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pincode,
      city,
      state,
      delivery_days,
      shipping_charge,
      is_available,
      category,
      product_id,
      metal_type,
      priority,
      notes
    } = req.body;

    // Get existing zone
    const { data: existingZone, error: fetchError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingZone) {
      return res.status(404).json({ message: 'Delivery zone not found' });
    }

    const updateData = {};

    if (pincode !== undefined) {
      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ message: 'Pincode must be 6 digits' });
      }
      updateData.pincode = pincode;
    }

    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (delivery_days !== undefined) updateData.delivery_days = parseInt(delivery_days);
    if (shipping_charge !== undefined) updateData.shipping_charge = parseFloat(shipping_charge);
    if (is_available !== undefined) updateData.is_available = is_available;
    if (category !== undefined) updateData.category = category || null;
    if (product_id !== undefined) updateData.product_id = product_id || null;
    if (metal_type !== undefined) updateData.metal_type = metal_type || null;
    if (priority !== undefined) updateData.priority = parseInt(priority);
    if (notes !== undefined) updateData.notes = notes || null;

    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery zone:', error);
      return res.status(500).json({ message: 'Error updating delivery zone' });
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: req.user.userId,
        action: 'delivery_zone_updated',
        entity_type: 'delivery_zone',
        entity_id: id,
        old_values: existingZone,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json(zone);
  } catch (error) {
    console.error('Error in updateDeliveryZone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete delivery zone
 * DELETE /api/admin/delivery-zones/:id
 */
const deleteDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: zone, error: fetchError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !zone) {
      return res.status(404).json({ message: 'Delivery zone not found' });
    }

    const { error } = await supabase
      .from('delivery_zones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting delivery zone:', error);
      return res.status(500).json({ message: 'Error deleting delivery zone' });
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: req.user.userId,
        action: 'delivery_zone_deleted',
        entity_type: 'delivery_zone',
        entity_id: id,
        old_values: zone,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json({ message: 'Delivery zone deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDeliveryZone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Bulk import delivery zones from CSV
 * POST /api/admin/delivery-zones/bulk-import
 */
const bulkImportDeliveryZones = async (req, res) => {
  try {
    const { zones } = req.body; // Array of zone objects

    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      return res.status(400).json({ message: 'Zones array is required' });
    }

    const results = {
      total: zones.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      try {
        // Validate required fields
        if (!zone.pincode || !zone.city || !zone.state || !zone.delivery_days) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            pincode: zone.pincode || 'N/A',
            error: 'Missing required fields (pincode, city, state, delivery_days)'
          });
          continue;
        }

        // Validate pincode
        if (!/^\d{6}$/.test(zone.pincode)) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            pincode: zone.pincode,
            error: 'Invalid pincode format (must be 6 digits)'
          });
          continue;
        }

        // Insert zone
        const { error: insertError } = await supabase
          .from('delivery_zones')
          .insert({
            pincode: zone.pincode,
            city: zone.city,
            state: zone.state,
            delivery_days: parseInt(zone.delivery_days),
            shipping_charge: parseFloat(zone.shipping_charge || 0),
            is_available: zone.is_available !== undefined ? zone.is_available : true,
            category: zone.category || null,
            product_id: zone.product_id || null,
            metal_type: zone.metal_type || null,
            priority: zone.priority ? parseInt(zone.priority) : 0,
            notes: zone.notes || null
          });

        if (insertError) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            pincode: zone.pincode,
            error: insertError.message
          });
        } else {
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          pincode: zone.pincode || 'N/A',
          error: error.message
        });
      }
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert({
        user_id: req.user.userId,
        action: 'delivery_zones_bulk_import',
        entity_type: 'delivery_zone',
        entity_id: null,
        new_values: { 
          total: results.total,
          successful: results.successful,
          failed: results.failed
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.json(results);
  } catch (error) {
    console.error('Error in bulkImportDeliveryZones:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get unique categories and metal types for filters
 * GET /api/admin/delivery-zones/filters
 */
const getDeliveryZoneFilters = async (req, res) => {
  try {
    const { data: categories } = await supabase
      .from('delivery_zones')
      .select('category')
      .not('category', 'is', null);

    const { data: metalTypes } = await supabase
      .from('delivery_zones')
      .select('metal_type')
      .not('metal_type', 'is', null);

    const uniqueCategories = [...new Set((categories || []).map(c => c.category).filter(Boolean))];
    const uniqueMetalTypes = [...new Set((metalTypes || []).map(m => m.metal_type).filter(Boolean))];

    res.json({
      categories: uniqueCategories,
      metalTypes: uniqueMetalTypes
    });
  } catch (error) {
    console.error('Error in getDeliveryZoneFilters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllDeliveryZones,
  getDeliveryZoneById,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  bulkImportDeliveryZones,
  getDeliveryZoneFilters
};
