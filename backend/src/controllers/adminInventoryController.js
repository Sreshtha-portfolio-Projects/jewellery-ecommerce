const supabase = require('../config/supabase');

/**
 * Get all inventory locks
 */
const getInventoryLocks = async (req, res) => {
  try {
    const { status, variant_id } = req.query;

    let query = supabase
      .from('inventory_locks')
      .select(`
        *,
        order_intent:order_intents(*),
        variant:product_variants(
          id,
          sku,
          product:products(name, sku)
        )
      `)
      .order('locked_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (variant_id) {
      query = query.eq('variant_id', variant_id);
    }

    const { data: locks, error } = await query;

    if (error) {
      console.error('Error fetching inventory locks:', error);
      return res.status(500).json({ message: 'Error fetching inventory locks' });
    }

    res.json({ locks: locks || [] });
  } catch (error) {
    console.error('Error in getInventoryLocks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Release inventory lock manually (admin)
 */
const releaseInventoryLock = async (req, res) => {
  try {
    const { lockId } = req.params;

    // Get lock
    const { data: lock, error: fetchError } = await supabase
      .from('inventory_locks')
      .select('*')
      .eq('id', lockId)
      .single();

    if (fetchError || !lock) {
      return res.status(404).json({ message: 'Inventory lock not found' });
    }

    if (lock.status !== 'LOCKED') {
      return res.status(400).json({ message: `Lock is already ${lock.status}` });
    }

    // Restore stock
    await supabase.rpc('increment_stock', {
      variant_id: lock.variant_id,
      quantity: lock.quantity_locked
    });

    // Mark as released
    await supabase
      .from('inventory_locks')
      .update({
        status: 'RELEASED',
        released_at: new Date().toISOString()
      })
      .eq('id', lockId);

    // If order intent exists and is still INTENT_CREATED, cancel it
    if (lock.order_intent_id) {
      const { data: intent } = await supabase
        .from('order_intents')
        .select('status')
        .eq('id', lock.order_intent_id)
        .single();

      if (intent && intent.status === 'INTENT_CREATED') {
        // Check if all locks are released
        const { data: remainingLocks } = await supabase
          .from('inventory_locks')
          .select('id')
          .eq('order_intent_id', lock.order_intent_id)
          .eq('status', 'LOCKED')
          .limit(1);

        if (!remainingLocks || remainingLocks.length === 0) {
          // All locks released, cancel intent
          await supabase
            .from('order_intents')
            .update({ status: 'CANCELLED' })
            .eq('id', lock.order_intent_id);
        }
      }
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'inventory_lock_released',
      entity_type: 'inventory_lock',
      entity_id: lockId,
      new_values: { variant_id: lock.variant_id, quantity: lock.quantity_locked }
    });

    res.json({ message: 'Inventory lock released successfully' });
  } catch (error) {
    console.error('Error in releaseInventoryLock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get inventory summary
 */
const getInventorySummary = async (req, res) => {
  try {
    // Get total stock
    const { data: variants } = await supabase
      .from('product_variants')
      .select('stock_quantity');

    const totalStock = (variants || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

    // Get locked stock
    const { data: locks } = await supabase
      .from('inventory_locks')
      .select('quantity_locked')
      .eq('status', 'LOCKED');

    const lockedStock = (locks || []).reduce((sum, l) => sum + (l.quantity_locked || 0), 0);

    // Get low stock variants
    const { data: lowStock } = await supabase
      .from('product_variants')
      .select('id, stock_quantity, sku, product:products(name)')
      .lt('stock_quantity', 10)
      .eq('is_active', true)
      .limit(20);

    res.json({
      total_stock: totalStock,
      locked_stock: lockedStock,
      available_stock: totalStock - lockedStock,
      low_stock_variants: lowStock || [],
      active_locks: locks?.length || 0
    });
  } catch (error) {
    console.error('Error in getInventorySummary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getInventoryLocks,
  releaseInventoryLock,
  getInventorySummary,
};

