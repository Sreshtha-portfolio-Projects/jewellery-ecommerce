/**
 * Metal Price Service
 *
 * Responsibilities:
 *  - Fetch gold (XAU) and silver (XAG) prices from MetalPriceAPI (server-side only)
 *  - Convert from troy ounce → gram
 *  - Upsert latest rate into metal_rates table
 *  - Append to metal_rates_history for audit trail
 *  - Provide getLatestRates() used by product pricing — falls back to DB if API is down
 *
 * NEVER call this from the frontend. API key stays server-side only.
 */

const https = require('https');
const supabase = require('../config/supabase');

// 1 troy ounce = 31.1035 grams (standard)
const TROY_OZ_TO_GRAM = 31.1035;

/**
 * Fetch spot prices from MetalPriceAPI.
 * Returns raw JSON or throws on HTTP / parse error.
 */
async function fetchFromAPI() {
  const apiKey = process.env.METAL_PRICE_API_KEY;
  if (!apiKey) {
    throw new Error('METAL_PRICE_API_KEY environment variable is not set');
  }

  // base=USD with INR included so we can convert to INR on our side.
  // Do NOT use base=INR — it returns oz-per-INR (inverse), not INR-per-oz.
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,INR`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.success) {
            reject(new Error(`MetalPriceAPI error: ${data.error?.message || JSON.stringify(data)}`));
          } else {
            resolve(data);
          }
        } catch (err) {
          reject(new Error(`Failed to parse MetalPriceAPI response: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('MetalPriceAPI request timed out'));
    });
  });
}

/**
 * Convert API response to per-gram prices in INR.
 *
 * MetalPriceAPI with base=USD returns rates as:
 *   rates.XAU = troy oz of gold you get per 1 USD  (e.g. 0.000481)
 *   rates.XAG = troy oz of silver you get per 1 USD (e.g. 0.0309)
 *   rates.INR = INR you get per 1 USD               (e.g. 83.5)
 *
 * Correct conversion:
 *   gold price per troy oz (INR) = (1 / rates.XAU) * rates.INR
 *   gold price per gram   (INR) = above / 31.1035
 */
function parseRates(apiData) {
  const rates = apiData.rates || {};

  const xauPerUsd = parseFloat(rates.XAU);   // oz of gold per 1 USD
  const xagPerUsd = parseFloat(rates.XAG);   // oz of silver per 1 USD
  const inrPerUsd = parseFloat(rates.INR);   // INR per 1 USD

  if (!xauPerUsd || !xagPerUsd || !inrPerUsd) {
    throw new Error(`Missing XAU, XAG, or INR in API response. Got: XAU=${rates.XAU}, XAG=${rates.XAG}, INR=${rates.INR}`);
  }

  // (USD per oz) × (INR per USD) = INR per troy oz
  const goldPerOz   = (1 / xauPerUsd) * inrPerUsd;
  const silverPerOz = (1 / xagPerUsd) * inrPerUsd;

  return {
    gold: {
      price_per_oz:   parseFloat(goldPerOz.toFixed(4)),
      price_per_gram: parseFloat((goldPerOz / TROY_OZ_TO_GRAM).toFixed(4)),
      currency: 'INR',
    },
    silver: {
      price_per_oz:   parseFloat(silverPerOz.toFixed(4)),
      price_per_gram: parseFloat((silverPerOz / TROY_OZ_TO_GRAM).toFixed(4)),
      currency: 'INR',
    },
  };
}

/**
 * Upsert a single metal rate into metal_rates and append to history.
 */
async function storeRate(metalType, priceData, updatedBy = null) {
  const now = new Date().toISOString();

  // Upsert into current rates table
  const { error: upsertError } = await supabase
    .from('metal_rates')
    .upsert(
      {
        metal_type:     metalType,
        price_per_gram: priceData.price_per_gram,
        price_per_oz:   priceData.price_per_oz,
        currency:       priceData.currency,
        source:         'metalpriceapi',
        last_updated:   now,
      },
      { onConflict: 'metal_type' }
    );

  if (upsertError) {
    console.error(`[metalPriceService] Failed to upsert ${metalType} rate:`, upsertError);
    throw new Error(`DB upsert failed for ${metalType}: ${upsertError.message}`);
  }

  // Append to history
  const { error: historyError } = await supabase
    .from('metal_rates_history')
    .insert({
      metal_type:     metalType,
      price_per_gram: priceData.price_per_gram,
      price_per_oz:   priceData.price_per_oz,
      currency:       priceData.currency,
      source:         'metalpriceapi',
      fetched_at:     now,
      updated_by:     updatedBy,
    });

  if (historyError) {
    // Non-fatal — history is audit only
    console.warn(`[metalPriceService] Failed to write history for ${metalType}:`, historyError);
  }
}

/**
 * Main entry point: fetch latest rates from API, store to DB.
 * If API fails, logs the error and returns null (system continues with last stored rate).
 *
 * @param {string|null} updatedBy - Admin user_id who triggered the fetch (null = automated)
 * @returns {{ gold, silver } | null}
 */
async function fetchAndStoreRates(updatedBy = null) {
  try {
    console.log('[metalPriceService] Fetching latest metal rates from API...');
    const apiData = await fetchFromAPI();
    const parsed  = parseRates(apiData);

    await storeRate('gold',   parsed.gold,   updatedBy);
    await storeRate('silver', parsed.silver, updatedBy);

    console.log(`[metalPriceService] Rates updated — Gold: ₹${parsed.gold.price_per_gram}/g | Silver: ₹${parsed.silver.price_per_gram}/g`);
    return parsed;
  } catch (err) {
    console.error('[metalPriceService] fetchAndStoreRates failed:', err.message);
    return null;
  }
}

/**
 * Read the latest stored rates from DB.
 * Used by product pricing service — does NOT call the external API.
 *
 * @returns {{ gold: RateRow|null, silver: RateRow|null }}
 */
async function getLatestRates() {
  const { data, error } = await supabase
    .from('metal_rates')
    .select('metal_type, price_per_gram, price_per_oz, currency, last_updated')
    .in('metal_type', ['gold', 'silver']);

  if (error) {
    console.error('[metalPriceService] getLatestRates DB error:', error);
    return { gold: null, silver: null };
  }

  const result = { gold: null, silver: null };
  (data || []).forEach((row) => {
    result[row.metal_type] = row;
  });
  return result;
}

/**
 * Get rate for a specific metal type (case-insensitive lookup).
 * Normalises 'Gold', 'GOLD', 'gold' → 'gold'.
 *
 * @param {string} metalType  - product.metal_type value
 * @returns {number|null}     - price_per_gram or null if not found
 */
async function getRateForMetal(metalType) {
  if (!metalType) return null;
  const key = metalType.toLowerCase().trim();
  if (key !== 'gold' && key !== 'silver') return null;

  const { data } = await supabase
    .from('metal_rates')
    .select('price_per_gram')
    .eq('metal_type', key)
    .single();

  return data ? parseFloat(data.price_per_gram) : null;
}

/**
 * Fetch rate history for a given metal (descending by time).
 */
async function getRateHistory(metalType, limit = 30) {
  const { data, error } = await supabase
    .from('metal_rates_history')
    .select('price_per_gram, price_per_oz, currency, fetched_at, updated_by')
    .eq('metal_type', metalType.toLowerCase())
    .order('fetched_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[metalPriceService] getRateHistory error:', error);
    return [];
  }
  return data || [];
}

module.exports = {
  fetchAndStoreRates,
  getLatestRates,
  getRateForMetal,
  getRateHistory,
};
