const supabase = require('../config/supabase');

/**
 * Get all pricing rules
 */
const getPricingRules = async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = supabase
      .from('pricing_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching pricing rules:', error);
      return res.status(500).json({ message: 'Error fetching pricing rules' });
    }

    res.json({ rules: rules || [] });
  } catch (error) {
    console.error('Error in getPricingRules:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create pricing rule
 */
const createPricingRule = async (req, res) => {
  try {
    const {
      name,
      description,
      rule_type,
      conditions,
      action_type,
      action_value,
      priority = 0,
      is_active = true,
      valid_from,
      valid_until
    } = req.body;

    if (!name || !rule_type || !conditions || !action_type || action_value === undefined) {
      return res.status(400).json({
        message: 'name, rule_type, conditions, action_type, and action_value are required'
      });
    }

    const { data: rule, error } = await supabase
      .from('pricing_rules')
      .insert({
        name,
        description: description || null,
        rule_type,
        conditions,
        action_type,
        action_value: parseFloat(action_value),
        priority: parseInt(priority),
        is_active,
        valid_from: valid_from || null,
        valid_until: valid_until || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing rule:', error);
      return res.status(500).json({ message: 'Error creating pricing rule' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'pricing_rule_created',
      entity_type: 'pricing_rule',
      entity_id: rule.id,
      new_values: { name, rule_type, action_type, action_value }
    });

    res.status(201).json({ message: 'Pricing rule created successfully', rule });
  } catch (error) {
    console.error('Error in createPricingRule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update pricing rule
 */
const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      rule_type,
      conditions,
      action_type,
      action_value,
      priority,
      is_active,
      valid_from,
      valid_until
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rule_type !== undefined) updateData.rule_type = rule_type;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (action_type !== undefined) updateData.action_type = action_type;
    if (action_value !== undefined) updateData.action_value = parseFloat(action_value);
    if (priority !== undefined) updateData.priority = parseInt(priority);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (valid_from !== undefined) updateData.valid_from = valid_from;
    if (valid_until !== undefined) updateData.valid_until = valid_until;
    updateData.updated_at = new Date().toISOString();

    const { data: rule, error } = await supabase
      .from('pricing_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing rule:', error);
      return res.status(500).json({ message: 'Error updating pricing rule' });
    }

    if (!rule) {
      return res.status(404).json({ message: 'Pricing rule not found' });
    }

    res.json({ message: 'Pricing rule updated successfully', rule });
  } catch (error) {
    console.error('Error in updatePricingRule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete pricing rule
 */
const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing rule:', error);
      return res.status(500).json({ message: 'Error deleting pricing rule' });
    }

    res.json({ message: 'Pricing rule deleted successfully' });
  } catch (error) {
    console.error('Error in deletePricingRule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Apply pricing rules to a product (helper function for product fetching)
 */
const applyPricingRules = async (product, variant = null) => {
  try {
    const now = new Date().toISOString();

    // Get active pricing rules
    const { data: rules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('priority', { ascending: false });

    if (!rules || rules.length === 0) {
      return product.base_price || product.price;
    }

    let finalPrice = variant?.price_override || product.base_price || product.price;

    // Apply rules in priority order
    for (const rule of rules) {
      const conditions = rule.conditions;
      let matches = true;

      // Check conditions
      if (conditions.metal_type && product.metal_type !== conditions.metal_type) {
        matches = false;
      }

      if (conditions.category && product.category !== conditions.category) {
        matches = false;
      }

      if (conditions.weight) {
        const weight = variant?.weight || 0;
        const operator = conditions.weight.operator || '>';
        const value = conditions.weight.value || 0;

        if (operator === '>' && weight <= value) matches = false;
        if (operator === '<' && weight >= value) matches = false;
        if (operator === '=' && weight !== value) matches = false;
        if (operator === '>=' && weight < value) matches = false;
        if (operator === '<=' && weight > value) matches = false;
      }

      if (matches) {
        // Apply action
        if (rule.action_type === 'percentage_markup') {
          finalPrice = finalPrice * (1 + rule.action_value / 100);
        } else if (rule.action_type === 'fixed_markup') {
          finalPrice = finalPrice + rule.action_value;
        } else if (rule.action_type === 'percentage_discount') {
          finalPrice = finalPrice * (1 - rule.action_value / 100);
        } else if (rule.action_type === 'fixed_discount') {
          finalPrice = finalPrice - rule.action_value;
        }
      }
    }

    return Math.max(0, finalPrice); // Ensure price is not negative
  } catch (error) {
    console.error('Error applying pricing rules:', error);
    return product.base_price || product.price;
  }
};

module.exports = {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  applyPricingRules,
};

