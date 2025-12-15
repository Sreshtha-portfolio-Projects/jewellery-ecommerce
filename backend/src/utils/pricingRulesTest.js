/**
 * Pricing Rules Engine Test/Verification
 * This file can be used to test pricing rules logic
 */

const { applyPricingRules } = require('../controllers/adminPricingController');

/**
 * Test pricing rules with sample data
 */
async function testPricingRules() {
  console.log('Testing Pricing Rules Engine...\n');

  // Sample product
  const product = {
    id: 'test-product-1',
    name: 'Gold Ring',
    category: 'rings',
    metal_type: 'Gold',
    base_price: 10000,
    price: 10000
  };

  // Sample variant
  const variant = {
    id: 'test-variant-1',
    weight: 8.5,
    price_override: null
  };

  console.log('Product:', product);
  console.log('Variant:', variant);
  console.log('Base Price:', product.base_price);

  // Test 1: No rules applied
  const price1 = await applyPricingRules(product, variant);
  console.log('\nTest 1 - No rules:', price1);

  // Test 2: With variant price override
  const variantWithOverride = { ...variant, price_override: 12000 };
  const price2 = await applyPricingRules(product, variantWithOverride);
  console.log('Test 2 - With variant override:', price2);

  // Test 3: With weight-based rule (if exists)
  const price3 = await applyPricingRules(product, variant);
  console.log('Test 3 - With weight rule:', price3);

  console.log('\n✅ Pricing rules test completed');
}

// Run test if called directly
if (require.main === module) {
  testPricingRules().catch(console.error);
}

module.exports = { testPricingRules };

