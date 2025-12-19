const PDFDocument = require('pdfkit');
const supabase = require('../config/supabase');

/**
 * Generate PDF invoice for an order
 * @param {Object} order - Order data with items, addresses, etc.
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#B8860B').text('Aldorado Jewells', 50, 50);
      doc.fontSize(12).fillColor('#666').text('Invoice', 50, 80);

      // Invoice Number and Date
      const invoiceNumber = `INV-${order.order_number}`;
      const invoiceDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      doc.fontSize(10).fillColor('#000').text(`Invoice Number: ${invoiceNumber}`, 400, 50);
      doc.text(`Invoice Date: ${invoiceDate}`, 400, 65);
      doc.text(`Order Number: ${order.order_number}`, 400, 80);
      doc.text(`Order Date: ${new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`, 400, 95);

      let yPos = 140;

      // Seller Details (from settings)
      const sellerName = order.seller_name || 'Aldorado Jewells';
      const sellerAddress = order.seller_address || 'Your Business Address';
      const sellerGstin = order.seller_gstin || 'GSTIN Number';
      const sellerPhone = order.seller_phone || 'Customer Support Number';
      const sellerEmail = order.seller_email || 'support@aldoradojewells.com';

      doc.fontSize(12).fillColor('#000').text('Sold By:', 50, yPos);
      yPos += 20;
      doc.fontSize(10).text(sellerName, 50, yPos);
      yPos += 15;
      doc.text(sellerAddress, 50, yPos);
      yPos += 15;
      doc.text(`GSTIN: ${sellerGstin}`, 50, yPos);
      yPos += 15;
      doc.text(`Phone: ${sellerPhone}`, 50, yPos);
      yPos += 15;
      doc.text(`Email: ${sellerEmail}`, 50, yPos);

      // Buyer Details
      yPos = 140;
      doc.fontSize(12).fillColor('#000').text('Bill To:', 350, yPos);
      yPos += 20;
      const shippingAddress = order.shipping_address || {};
      doc.fontSize(10).text(shippingAddress.full_name || 'Customer', 350, yPos);
      yPos += 15;
      if (shippingAddress.address_line1) {
        doc.text(shippingAddress.address_line1, 350, yPos);
        yPos += 15;
      }
      if (shippingAddress.address_line2) {
        doc.text(shippingAddress.address_line2, 350, yPos);
        yPos += 15;
      }
      const postalCode = shippingAddress.pincode || shippingAddress.postal_code;
      if (shippingAddress.city && shippingAddress.state && postalCode) {
        doc.text(`${shippingAddress.city}, ${shippingAddress.state} - ${postalCode}`, 350, yPos);
        yPos += 15;
      }
      if (shippingAddress.phone) {
        doc.text(`Phone: ${shippingAddress.phone}`, 350, yPos);
      }

      // Line Items Table
      yPos = 280;
      doc.fontSize(12).fillColor('#000').text('Items', 50, yPos);
      yPos += 25;

      // Table Header
      doc.fontSize(10).fillColor('#666');
      doc.text('Item', 50, yPos);
      doc.text('Variant', 150, yPos);
      doc.text('Qty', 300, yPos);
      doc.text('Unit Price', 350, yPos, { align: 'right' });
      doc.text('Total', 450, yPos, { align: 'right' });

      yPos += 20;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke('#ccc');
      yPos += 10;

      // Table Rows
      const orderItems = order.order_items || [];
      orderItems.forEach((item) => {
        const variantText = item.variant_snapshot
          ? [item.variant_snapshot.size, item.variant_snapshot.color, item.variant_snapshot.finish]
              .filter(Boolean).join(', ')
          : '-';

        doc.fontSize(9).fillColor('#000');
        doc.text(item.product_name || 'Product', 50, yPos, { width: 100 });
        doc.text(variantText, 150, yPos, { width: 140 });
        doc.text(String(item.quantity || 0), 300, yPos);
        doc.text(formatCurrency(item.product_price || 0), 350, yPos, { align: 'right' });
        doc.text(formatCurrency(item.subtotal || 0), 450, yPos, { align: 'right' });

        yPos += 20;
      });

      // Totals Section
      yPos += 10;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke('#ccc');
      yPos += 20;

      const subtotal = parseFloat(order.subtotal || 0);
      const discountAmount = parseFloat(order.discount_amount || 0);
      const taxAmount = parseFloat(order.tax_amount || 0);
      const shippingCost = parseFloat(order.shipping_cost || 0);
      const totalAmount = parseFloat(order.total_amount || 0);

      doc.fontSize(10).fillColor('#000');
      doc.text('Subtotal:', 400, yPos);
      doc.text(formatCurrency(subtotal), 450, yPos, { align: 'right' });
      yPos += 20;

      if (discountAmount > 0) {
        const discountText = order.discount_code
          ? `Discount (${order.discount_code}):`
          : 'Discount:';
        doc.text(discountText, 400, yPos);
        doc.text(`-${formatCurrency(discountAmount)}`, 450, yPos, { align: 'right' });
        yPos += 20;
      }

      doc.text('Tax (GST):', 400, yPos);
      doc.text(formatCurrency(taxAmount), 450, yPos, { align: 'right' });
      yPos += 20;

      doc.text('Shipping:', 400, yPos);
      doc.text(shippingCost > 0 ? formatCurrency(shippingCost) : 'Free', 450, yPos, { align: 'right' });
      yPos += 20;

      doc.moveTo(400, yPos).lineTo(550, yPos).stroke('#000');
      yPos += 10;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000');
      doc.text('Total Amount:', 400, yPos);
      doc.text(formatCurrency(totalAmount), 450, yPos, { align: 'right' });

      // Payment Details
      yPos += 40;
      doc.fontSize(10).font('Helvetica').fillColor('#000');
      doc.text('Payment Details:', 50, yPos);
      yPos += 20;
      doc.text(`Payment Method: ${order.payment_method || 'Online'}`, 50, yPos);
      yPos += 15;
      if (order.razorpay_payment_id) {
        const maskedPaymentId = order.razorpay_payment_id.length >= 8
          ? order.razorpay_payment_id.substring(0, 8) + '****'
          : '****';
        doc.text(`Transaction ID: ${maskedPaymentId}`, 50, yPos);
        yPos += 15;
      }
      doc.text(`Payment Date: ${new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`, 50, yPos);

      // Footer
      yPos = 750;
      doc.fontSize(8).fillColor('#666').text(
        'Thank you for your purchase!',
        50,
        yPos,
        { align: 'center', width: 500 }
      );
      yPos += 15;
      doc.text(
        'This is a computer-generated invoice and does not require a signature.',
        50,
        yPos,
        { align: 'center', width: 500 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format currency for invoice
 */
const formatCurrency = (amount) => {
  return `₹${parseInt(amount).toLocaleString('en-IN')}`;
};

/**
 * Upload invoice PDF to Supabase Storage and save metadata
 * @param {Object} order - Order data
 * @returns {Promise<Object>} Invoice data with URL
 */
const generateAndStoreInvoice = async (order) => {
  try {
    // Check if invoice already exists
    if (order.invoice_id && order.invoice_url) {
      return {
        invoice_id: order.invoice_id,
        invoice_url: order.invoice_url,
        invoice_created_at: order.invoice_created_at
      };
    }

    // Fetch seller details from admin settings
    const { data: sellerSettings } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['seller_name', 'seller_address', 'seller_gstin', 'seller_phone', 'seller_email']);

    const sellerDetails = {};
    (sellerSettings || []).forEach(setting => {
      sellerDetails[setting.setting_key] = setting.setting_value;
    });

    // Add seller details to order object for PDF generation
    order.seller_name = sellerDetails.seller_name || 'Aldorado Jewells';
    order.seller_address = sellerDetails.seller_address || 'Your Business Address';
    order.seller_gstin = sellerDetails.seller_gstin || 'GSTIN Number';
    order.seller_phone = sellerDetails.seller_phone || 'Customer Support Number';
    order.seller_email = sellerDetails.seller_email || 'support@aldoradojewells.com';

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(order);

    // Generate unique filename
    const invoiceNumber = `INV-${order.order_number}`;
    const fileName = `invoices/${order.id}/${invoiceNumber}.pdf`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading invoice to storage:', uploadError);
      throw new Error('Failed to upload invoice to storage');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const invoiceUrl = urlData.publicUrl;
    const invoiceCreatedAt = new Date().toISOString();

    // Update order with invoice metadata
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_id: invoiceNumber,
        invoice_url: invoiceUrl,
        invoice_created_at: invoiceCreatedAt
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order with invoice metadata:', updateError);
      // Try to delete uploaded file
      await supabase.storage.from('invoices').remove([fileName]);
      throw new Error('Failed to save invoice metadata');
    }

    return {
      invoice_id: invoiceNumber,
      invoice_url: invoiceUrl,
      invoice_created_at: invoiceCreatedAt
    };
  } catch (error) {
    console.error('Error in generateAndStoreInvoice:', error);
    throw error;
  }
};

module.exports = {
  generateInvoicePDF,
  generateAndStoreInvoice,
  formatCurrency
};
