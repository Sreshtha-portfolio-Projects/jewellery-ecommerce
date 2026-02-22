/**
 * Admin Metal Rates Controller
 *
 * All endpoints are admin-protected (requireAuth middleware applied in routes).
 *
 * Endpoints:
 *  GET  /api/admin/metal-rates            – current stored rates
 *  POST /api/admin/metal-rates/update     – trigger live fetch from MetalPriceAPI
 *  GET  /api/admin/metal-rates/history    – rate change history
 *  POST /api/admin/metal-rates/recalculate-products – bulk-update product prices using latest stored rates
 */

const supabase = require('../config/supabase');
const { fetchAndStoreRates, getLatestRates, getRateHistory } = require('../services/metalPriceService');

/**
 * GET /api/admin/metal-rates
 * Returns the current stored gold and silver rates.
 */
const getCurrentRates = async (req, res) => {
  try {
    const rates = await getLatestRates();
    res.json({
      rates,
      gold:   rates.gold,
      silver: rates.silver,
    });
  } catch (error) {
    console.error('[adminMetalRates] getCurrentRates error:', error);
    res.status(500).json({ message: 'Failed to fetch metal rates' });
  }
};

/**
 * POST /api/admin/metal-rates/update
 * Admin clicks "Update Metal Rates" — fetches live prices from MetalPriceAPI and stores them.
 */
const triggerRateUpdate = async (req, res) => {
  try {
    const updatedBy = req.user?.userId || null;
    const result = await fetchAndStoreRates(updatedBy);

    if (!result) {
      // API failed — return last stored rates so admin knows current DB values
      const stored = await getLatestRates();
      return res.status(502).json({
        message: 'MetalPriceAPI fetch failed. Showing last stored rates.',
        rates: stored,
        api_success: false,
      });
    }

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      user_id:     updatedBy,
      action:      'metal_rates_updated',
      entity_type: 'metal_rates',
      entity_id:   null,
      new_values: {
        gold_per_gram:   result.gold.price_per_gram,
        silver_per_gram: result.silver.price_per_gram,
        currency:        'INR',
      },
    });

    res.json({
      message: 'Metal rates updated successfully',
      rates: result,
      api_success: true,
    });
  } catch (error) {
    console.error('[adminMetalRates] triggerRateUpdate error:', error);
    res.status(500).json({ message: 'Internal server error while updating metal rates' });
  }
};

/**
 * GET /api/admin/metal-rates/history?metal=gold&limit=30
 * Returns rate history for charting or audit.
 */
const getRatesHistory = async (req, res) => {
  try {
    const metal = (req.query.metal || 'gold').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    if (!['gold', 'silver'].includes(metal)) {
      return res.status(400).json({ message: 'metal must be "gold" or "silver"' });
    }

    const history = await getRateHistory(metal, limit);
    res.json({ metal, history });
  } catch (error) {
    console.error('[adminMetalRates] getRatesHistory error:', error);
    res.status(500).json({ message: 'Failed to fetch rate history' });
  }
};

/**
 * POST /api/admin/metal-rates/recalculate-products
 *
 * Bulk-recalculates selling prices for products that use dynamic metal rates.
 *
 * A product is recalculated when its `metals` JSONB array is non-empty.
 * For each metal entry in product.metals, if entry.use_live_rate === true,
 * we replace entry.rate_per_gram with the latest stored rate and recompute entry.amount.
 *
 * Then the full jewellery costing formula is re-applied:
 *   overhead_amount = labour_cost_internal * overhead_percent / 100
 *   subtotal        = metal_amount + stone_amount + labour_cost_internal + overhead_amount
 *   margin_amount   = subtotal * margin_percent / 100
 *   final_price     = subtotal + margin_amount
 *
 * Products with use_live_rate === false on ALL metal entries are skipped (manual pricing).
 */
const recalculateProductPrices = async (req, res) => {
  try {
    const rates = await getLatestRates();

    if (!rates.gold && !rates.silver) {
      return res.status(503).json({ message: 'No metal rates available. Update rates first.' });
    }

    // Fetch all active products that have metals
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, metals, stones, labour, overhead_percent, margin_percent')
      .eq('is_active', true)
      .not('metals', 'eq', '[]');

    if (fetchError) {
      console.error('[adminMetalRates] recalculate fetch error:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    const updatedBy  = req.user?.userId || null;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors     = [];

    for (const product of (products || [])) {
      try {
        const metals = product.metals || [];

        // Check if any metal entry wants live rate
        const hasLiveRateEntry = metals.some((m) => m.use_live_rate === true);
        if (!hasLiveRateEntry) {
          skippedCount++;
          continue;
        }

        // Recalculate each metal entry
        // Field name notes — the product form saves metals with these field names:
        //   name         → metal name ("Gold", "Silver")   [NOT metal_type]
        //   gross_weight → weight in grams                 [NOT weight]
        //   rate         → rate per gram                   [NOT rate_per_gram]
        //   amount       → computed amount
        // We support both naming conventions so old and new records both work.
        const updatedMetals = metals.map((entry) => {
          if (!entry.use_live_rate) return entry;

          // Support both field names for metal type
          const metalRaw = (entry.metal_type || entry.name || '').toLowerCase().trim();
          // Normalise common names → 'gold' or 'silver'
          const metalKey = metalRaw.startsWith('gold') ? 'gold'
                         : metalRaw.startsWith('silver') ? 'silver'
                         : metalRaw;
          const rateRow  = rates[metalKey];
          if (!rateRow) return entry; // unknown metal — leave as-is

          const newRate   = parseFloat(rateRow.price_per_gram);
          // Support both gross_weight (form) and weight (legacy)
          const weight    = parseFloat(entry.gross_weight || entry.weight) || 0;
          const newAmount = parseFloat((newRate * weight).toFixed(2));

          return {
            ...entry,
            rate:          newRate,   // frontend form uses 'rate'
            rate_per_gram: newRate,   // keep for backward compat
            amount:        newAmount,
          };
        });

        // Recompute jewellery pricing formula
        const metal_amount        = updatedMetals.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
        const stone_amount        = (product.stones || []).reduce((s, st) => s + (parseFloat(st.amount) || 0), 0);
        const labour_cost_internal = (product.labour || []).reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
        const overhead_pct        = parseFloat(product.overhead_percent) || 0;
        const margin_pct          = parseFloat(product.margin_percent) || 0;

        const overhead_amount = labour_cost_internal * overhead_pct / 100;
        const subtotal        = metal_amount + stone_amount + labour_cost_internal + overhead_amount;
        const margin_amount   = subtotal * margin_pct / 100;
        const final_price     = subtotal + margin_amount;
        const labour_charge_visible = final_price - metal_amount - stone_amount;

        const { error: updateError } = await supabase
          .from('products')
          .update({
            metals:                updatedMetals,
            metal_amount,
            overhead_amount,
            margin_amount,
            labour_cost_internal,
            labour_charge_visible,
            cost_price:            metal_amount + stone_amount + labour_cost_internal,
            selling_price:         parseFloat(final_price.toFixed(2)),
            base_price:            parseFloat(final_price.toFixed(2)),
            price:                 parseFloat(final_price.toFixed(2)),
            updated_at:            new Date().toISOString(),
          })
          .eq('id', product.id);

        if (updateError) {
          errors.push({ product_id: product.id, error: updateError.message });
        } else {
          updatedCount++;
        }
      } catch (itemErr) {
        errors.push({ product_id: product.id, error: itemErr.message });
      }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id:     updatedBy,
      action:      'product_prices_recalculated',
      entity_type: 'products',
      entity_id:   null,
      new_values: {
        updated_count: updatedCount,
        skipped_count: skippedCount,
        gold_rate:     rates.gold?.price_per_gram,
        silver_rate:   rates.silver?.price_per_gram,
      },
    });

    res.json({
      message:       `Recalculation complete. ${updatedCount} product(s) updated, ${skippedCount} skipped.`,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      error_count:   errors.length,
      errors:        errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[adminMetalRates] recalculateProductPrices error:', error);
    res.status(500).json({ message: 'Internal server error during recalculation' });
  }
};

module.exports = {
  getCurrentRates,
  triggerRateUpdate,
  getRatesHistory,
  recalculateProductPrices,
};
