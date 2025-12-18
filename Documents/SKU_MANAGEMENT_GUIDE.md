# SKU Management System - Aldorado Jewells

## Overview

The platform uses an **intelligent auto-generation system** for SKUs (Stock Keeping Units) with manual override capability.

## SKU Format

### Product SKU Format
```
[CATEGORY]-[PRODUCT]-[ID]
```

**Example:**
- Product: "Solitaire Diamond Ring" in category "rings"
- SKU: `RIN-SOL-a1b2` (RIN = rings, SOL = solitaire, a1b2 = first 4 chars of UUID)

### Variant SKU Format
```
[PRODUCT-SKU]-[SIZE]-[COLOR]-[FINISH]-[ID]
```

**Example:**
- Product SKU: `RIN-SOL-a1b2`
- Variant: Size 6, Gold, Polished
- SKU: `RIN-SOL-a1b2-6-GO-PO-xy` (6 = size, GO = gold, PO = polished, xy = variant ID)

## Auto-Generation Rules

### Product SKU
1. **Category Prefix**: First 3 letters of category (uppercase)
   - `rings` → `RIN`
   - `necklaces` → `NEC`
   - `earrings` → `EAR`

2. **Product Name**: First 3 letters (uppercase, alphanumeric only)
   - "Solitaire Diamond Ring" → `SOL`
   - "Gold Chain" → `GOL`

3. **Unique ID**: First 4 characters of product UUID

4. **Uniqueness**: If SKU exists, adds counter suffix (`-1`, `-2`, etc.)

### Variant SKU
1. **Base**: Uses product SKU as prefix
2. **Size Code**: First 2-3 characters of size
   - "6" → `6`
   - "Large" → `LAR`
3. **Color Code**: First 2 characters of color
   - "Gold" → `GO`
   - "Rose Gold" → `RO`
4. **Finish Code**: First 2 characters of finish
   - "Polished" → `PO`
   - "Matte" → `MA`
5. **Variant ID**: Last 2 characters of variant UUID

## Manual Override

Admins can manually set SKU when:
- Creating products/variants
- Editing products/variants

**Manual SKU Requirements:**
- Must be unique
- Recommended format: Alphanumeric with hyphens
- Max length: 100 characters

## Database Functions

### `generate_product_sku(name, category, id)`
Automatically generates product SKU based on name, category, and UUID.

### `generate_variant_sku(product_sku, size, color, finish, variant_id)`
Automatically generates variant SKU based on product SKU and variant attributes.

## Best Practices

1. **Let System Generate**: Unless you have specific requirements, let the system auto-generate SKUs
2. **Consistent Format**: If manually setting, follow the format: `CAT-PROD-XXXX` for products
3. **Unique Values**: Always ensure SKU uniqueness (enforced by database)
4. **Searchable**: SKUs are indexed for fast lookups

## Examples

### Product Examples
```
Product: "Gold Necklace" (category: necklaces)
Auto SKU: NEC-GOL-c3d4

Product: "Diamond Earrings" (category: earrings)
Auto SKU: EAR-DIA-e5f6
```

### Variant Examples
```
Product: RIN-SOL-a1b2
Variant 1: Size 6, Gold, Polished
SKU: RIN-SOL-a1b2-6-GO-PO-xy

Variant 2: Size 7, Rose Gold, Matte
SKU: RIN-SOL-a1b2-7-RO-MA-z1
```

## Migration

Run `migrations/improve-sku-management.sql` to:
1. Add auto-generation functions
2. Add triggers for automatic SKU creation
3. Update existing products/variants without SKUs

## Benefits

✅ **Automatic**: No manual SKU entry required
✅ **Unique**: Guaranteed uniqueness
✅ **Searchable**: Easy to find products by SKU
✅ **Flexible**: Manual override available
✅ **Consistent**: Standardized format across platform
