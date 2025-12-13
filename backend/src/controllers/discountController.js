const supabase = require('../config/supabase');

const getDiscounts = async (req, res) => {
  try {
    const { code } = req.query;
    const isAdmin = req.user?.role === 'admin';

    let query = supabase.from('discounts').select('*');

    if (code) {
      query = query.eq('code', code.toUpperCase());
    }

    // Non-admins only see active discounts
    if (!isAdmin) {
      query = query.eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discounts:', error);
      return res.status(500).json({ message: 'Error fetching discounts' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in getDiscounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const validateDiscount = async (req, res) => {
  try {
    const { code, cartValue } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Discount code is required' });
    }

    const { data: discount, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return res.status(404).json({ message: 'Invalid discount code' });
    }

    // Check expiry
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Discount code has expired' });
    }

    // Check minimum cart value
    if (cartValue && parseFloat(cartValue) < parseFloat(discount.minimum_cart_value)) {
      return res.status(400).json({ 
        message: `Minimum cart value of ₹${discount.minimum_cart_value} required`,
        minimumCartValue: discount.minimum_cart_value
      });
    }

    // Check max uses
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return res.status(400).json({ message: 'Discount code has reached maximum uses' });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (cartValue) {
      if (discount.discount_type === 'percentage') {
        discountAmount = (parseFloat(cartValue) * parseFloat(discount.discount_value)) / 100;
      } else {
        discountAmount = parseFloat(discount.discount_value);
      }
      if (discountAmount > parseFloat(cartValue)) {
        discountAmount = parseFloat(cartValue);
      }
    }

    res.json({
      valid: true,
      discount: {
        code: discount.code,
        type: discount.discount_type,
        value: discount.discount_value,
        amount: discountAmount,
        description: discount.description
      }
    });
  } catch (error) {
    console.error('Error in validateDiscount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createDiscount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { code, description, discountType, discountValue, minimumCartValue, maxUses, expiresAt } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ message: 'Code, type, and value are required' });
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Percentage must be between 0 and 100' });
    }

    if (discountType === 'flat' && discountValue < 0) {
      return res.status(400).json({ message: 'Discount value must be positive' });
    }

    const { data, error } = await supabase
      .from('discounts')
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type: discountType,
        discount_value: discountValue,
        minimum_cart_value: minimumCartValue || 0,
        max_uses: maxUses || null,
        expires_at: expiresAt || null,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Discount code already exists' });
      }
      console.error('Error creating discount:', error);
      return res.status(500).json({ message: 'Error creating discount' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'discount_created',
      entity_type: 'discount',
      entity_id: data.id,
      new_values: data,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error in createDiscount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDiscount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    // Get existing discount
    const { data: existing, error: fetchError } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Prepare update
    const allowedFields = ['description', 'discount_value', 'minimum_cart_value', 'max_uses', 'expires_at', 'is_active'];
    const update = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        update[field] = updateData[field];
      }
    }

    if (updateData.code && updateData.code !== existing.code) {
      update.code = updateData.code.toUpperCase();
    }

    const { data, error } = await supabase
      .from('discounts')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount:', error);
      return res.status(500).json({ message: 'Error updating discount' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'discount_updated',
      entity_type: 'discount',
      entity_id: id,
      old_values: existing,
      new_values: data,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json(data);
  } catch (error) {
    console.error('Error in updateDiscount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteDiscount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount:', error);
      return res.status(500).json({ message: 'Error deleting discount' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'discount_deleted',
      entity_type: 'discount',
      entity_id: id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDiscount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDiscounts,
  validateDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount
};

