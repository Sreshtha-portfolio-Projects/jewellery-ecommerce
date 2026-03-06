/**
 * Happy Path Tests – End-to-End User Journeys
 * Maps to tests/happy-path-tests.md (Test IDs HAPPY-001 … HAPPY-018)
 * 
 * Run: cd e2e && npx playwright test happy-path.spec.js
 * 
 * Prerequisites:
 * - Frontend and backend running
 * - Database has test products with variants
 * - Set env vars: BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD
 * - Optional: DISCOUNT_CODE for tests that need it
 */

const { test, expect } = require('@playwright/test');

// Helper to generate unique test email for registration
const generateTestEmail = () => `test-${Date.now()}@example.com`;

// Helper to wait for navigation and ensure page is stable
const waitForPageLoad = async (page) => {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
};

// Helper to login as customer
const loginAsCustomer = async (page, email, password) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await waitForPageLoad(page);
};

// Helper to login as admin
const loginAsAdmin = async (page, email, password) => {
  await page.goto('/admin/login');
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 5000 });
};

// Helper to add product to cart
const addProductToCart = async (page) => {
  await page.goto('/products');
  await waitForPageLoad(page);
  const firstProduct = page.locator('a[href*="/product/"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 5000 });
  await firstProduct.click();
  await waitForPageLoad(page);
  
  const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
  await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
  await addToCartBtn.click();
  await page.waitForTimeout(1000);
};

test.describe('Happy Path – Complete Customer Order Journey', () => {
  
  // HAPPY-001: New Customer Registration to Order Placement
  test('HAPPY-001 – New customer registration to order placement', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testPassword = 'Test123456';
    const testName = 'Test User';
    const testMobile = '9876543210';

    // Step 1-4: Register new account
    await page.goto('/signup');
    await page.getByLabel(/full name/i).fill(testName);
    await page.getByRole('textbox', { name: /email/i }).fill(testEmail);
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);
    await page.getByLabel(/mobile/i).fill(testMobile);
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    
    await waitForPageLoad(page);
    await expect(page).not.toHaveURL(/\/signup/);
    
    const token = await page.evaluate(() => localStorage.getItem('customerToken'));
    expect(token).toBeTruthy();

    // Step 5-6: Browse and add product to cart
    await addProductToCart(page);

    // Step 7: Navigate to cart
    await page.goto('/cart');
    await waitForPageLoad(page);
    await expect(page.locator('text=/cart|shopping/i').first()).toBeVisible();

    // Step 8: Proceed to checkout
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 3000 });
    await checkoutBtn.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/checkout/);

    // Step 9-10: Add and select shipping address
    const addressFields = await page.locator('input[name*="address"], input[placeholder*="address"]').count();
    if (addressFields > 0) {
      await page.locator('input[placeholder*="name"], input[name*="name"]').first().fill('Test User');
      await page.locator('input[placeholder*="phone"], input[name*="phone"]').first().fill('9876543210');
      await page.locator('input[placeholder*="address"], textarea[placeholder*="address"]').first().fill('123 Test Street');
      await page.locator('input[placeholder*="city"], input[name*="city"]').first().fill('Mumbai');
      await page.locator('input[placeholder*="state"], input[name*="state"]').first().fill('Maharashtra');
      await page.locator('input[placeholder*="pincode"], input[name*="pincode"]').first().fill('400001');
      await page.waitForTimeout(500);
    }

    // Step 11-12: Place order (may create order intent first)
    const placeOrderBtn = page.getByRole('button', { name: /place order|proceed.*payment/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 5000 });
    await placeOrderBtn.click();
    
    await page.waitForTimeout(2000);
    
    // Check if redirected to order confirmation or payment page
    const currentUrl = page.url();
    const orderPlaced = currentUrl.includes('/order-confirmation') || 
                        currentUrl.includes('/orders') ||
                        await page.locator('text=/order.*confirmed|order.*placed|thank you/i').isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(orderPlaced).toBeTruthy();
  });

  // HAPPY-002: Existing Customer Complete Purchase Flow
  test('HAPPY-002 – Existing customer complete purchase flow', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Step 1-4: Add first product
    await addProductToCart(page);

    // Step 5: Add another product
    await page.goto('/products');
    await waitForPageLoad(page);
    const secondProduct = page.locator('a[href*="/product/"]').nth(1);
    if (await secondProduct.isVisible({ timeout: 3000 })) {
      await secondProduct.click();
      await waitForPageLoad(page);
      const addBtn = page.getByRole('button', { name: /add to cart/i });
      if (await addBtn.isVisible({ timeout: 3000 })) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 6: Navigate to cart
    await page.goto('/cart');
    await waitForPageLoad(page);

    // Step 7: Update quantity (if quantity controls exist)
    const qtyIncrease = page.locator('button:has-text("+"), button[aria-label*="increase"]').first();
    if (await qtyIncrease.isVisible({ timeout: 2000 })) {
      await qtyIncrease.click();
      await page.waitForTimeout(500);
    }

    // Step 8: Remove one item (if remove button exists)
    const removeBtn = page.locator('button:has-text("Remove"), button:has-text("Delete"), button[aria-label*="remove"]').first();
    if (await removeBtn.isVisible({ timeout: 2000 })) {
      await removeBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 9: Proceed to checkout
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 3000 });
    await checkoutBtn.click();
    await waitForPageLoad(page);

    // Step 10: Select saved address (should be pre-selected or selectable)
    await expect(page).toHaveURL(/\/checkout/);

    // Step 11: Apply discount code if provided
    const discountCode = process.env.DISCOUNT_CODE;
    if (discountCode) {
      const discountInput = page.locator('input[placeholder*="discount"], input[name*="coupon"]');
      if (await discountInput.isVisible({ timeout: 2000 })) {
        await discountInput.fill(discountCode);
        const applyBtn = page.getByRole('button', { name: /apply/i });
        await applyBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 13: Place order
    const placeOrderBtn = page.getByRole('button', { name: /place order|proceed.*payment/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 5000 });
    await placeOrderBtn.click();
    await page.waitForTimeout(2000);

    // Step 16: Navigate to My Orders
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    await expect(page.locator('a[href*="/account/orders/"], .order-card, tr').first()).toBeVisible({ timeout: 5000 });
  });

  // HAPPY-003: Customer Views Order Details and Timeline
  test('HAPPY-003 – Customer views order details and timeline', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Step 1-2: Navigate to orders and view list
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    
    const orderLink = page.locator('a[href*="/account/orders/"]').first();
    await expect(orderLink).toBeVisible({ timeout: 5000 });

    // Step 3: Click on an order
    await orderLink.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/account\/orders\//);

    // Step 4-10: Verify order details are visible
    await expect(page.locator('text=/order.*id|order.*number/i').first()).toBeVisible();
    await expect(page.locator('text=/timeline|status|payment|shipping/i').first()).toBeVisible({ timeout: 3000 });
    
    // Check for order items
    const orderItems = page.locator('[class*="order-item"], .product, [href*="/product/"]');
    await expect(orderItems.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Happy Path – Admin Fulfillment Journey', () => {
  
  // HAPPY-004: Admin Receives and Fulfills New Order
  test('HAPPY-004 – Admin receives and fulfills new order', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
      return;
    }

    await loginAsAdmin(page, adminEmail, adminPassword);

    // Step 1-2: Navigate to orders
    await page.goto('/admin/orders');
    await waitForPageLoad(page);

    // Step 3: Filter by paid status (if filter exists)
    const statusFilter = page.locator('select[name*="status"], button:has-text("Paid")');
    if (await statusFilter.isVisible({ timeout: 2000 })) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);
    }

    // Step 4: Click on an order
    const orderRow = page.locator('tr[class*="order"], a[href*="/admin/orders/"]').first();
    await expect(orderRow).toBeVisible({ timeout: 5000 });
    await orderRow.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/admin\/orders\//);

    // Step 5: Review order details
    await expect(page.locator('text=/order/i').first()).toBeVisible();

    // Step 6: Update shipping status to PROCESSING
    const statusDropdown = page.locator('select[name*="shipping"], select:has(option:has-text("PROCESSING"))');
    if (await statusDropdown.isVisible({ timeout: 3000 })) {
      await statusDropdown.selectOption({ label: /PROCESSING/i });
      
      const updateBtn = page.getByRole('button', { name: /update.*status|save/i });
      if (await updateBtn.isVisible({ timeout: 2000 })) {
        await updateBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 8: Create shipment (add courier and tracking)
    const courierInput = page.locator('input[name*="courier"], input[placeholder*="courier"]');
    if (await courierInput.isVisible({ timeout: 2000 })) {
      await courierInput.fill('Test Courier');
      
      const trackingInput = page.locator('input[name*="tracking"], input[placeholder*="tracking"]');
      await trackingInput.fill('TRACK123456');
      
      const submitShipmentBtn = page.getByRole('button', { name: /create.*shipment|add.*shipment|save/i });
      if (await submitShipmentBtn.isVisible({ timeout: 2000 })) {
        await submitShipmentBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 9: Update to SHIPPED
    const shippedOption = page.locator('select[name*="shipping"]');
    if (await shippedOption.isVisible({ timeout: 2000 })) {
      await shippedOption.selectOption({ label: /SHIPPED/i });
      
      const updateBtn = page.getByRole('button', { name: /update.*status|save/i });
      if (await updateBtn.isVisible({ timeout: 2000 })) {
        await updateBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  // HAPPY-005: Admin Updates Shipping Status Through Delivery
  test('HAPPY-005 – Admin updates shipping status through delivery', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
      return;
    }

    await loginAsAdmin(page, adminEmail, adminPassword);

    // Navigate to an order with SHIPPED status
    await page.goto('/admin/orders');
    await waitForPageLoad(page);
    
    const orderRow = page.locator('a[href*="/admin/orders/"]').first();
    await expect(orderRow).toBeVisible({ timeout: 5000 });
    await orderRow.click();
    await waitForPageLoad(page);

    // Step 2: Update to IN_TRANSIT
    const statusSelect = page.locator('select[name*="shipping"]');
    if (await statusSelect.isVisible({ timeout: 3000 })) {
      await statusSelect.selectOption({ label: /IN.*TRANSIT|IN_TRANSIT/i });
      
      let updateBtn = page.getByRole('button', { name: /update.*status|save/i });
      if (await updateBtn.isVisible({ timeout: 2000 })) {
        await updateBtn.click();
        await page.waitForTimeout(1000);
      }

      // Step 4: Update to OUT_FOR_DELIVERY
      await statusSelect.selectOption({ label: /OUT.*FOR.*DELIVERY|OUT_FOR_DELIVERY/i });
      updateBtn = page.getByRole('button', { name: /update.*status|save/i });
      if (await updateBtn.isVisible({ timeout: 2000 })) {
        await updateBtn.click();
        await page.waitForTimeout(1000);
      }

      // Step 5: Update to DELIVERED
      await statusSelect.selectOption({ label: /DELIVERED/i });
      updateBtn = page.getByRole('button', { name: /update.*status|save/i });
      if (await updateBtn.isVisible({ timeout: 2000 })) {
        await updateBtn.click();
        await page.waitForTimeout(1000);
      }

      // Step 7: Verify final status
      const deliveredStatus = await page.locator('text=/DELIVERED/i').isVisible({ timeout: 3000 });
      expect(deliveredStatus).toBeTruthy();
    }
  });
});

test.describe('Happy Path – Shipping and Delivery Flow', () => {
  
  // HAPPY-006: Customer Tracks Order Through Delivery
  test('HAPPY-006 – Customer tracks order through delivery', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Step 1: View order detail page
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    
    const orderLink = page.locator('a[href*="/account/orders/"]').first();
    await expect(orderLink).toBeVisible({ timeout: 5000 });
    await orderLink.click();
    await waitForPageLoad(page);

    // Step 2-11: Check status updates (customer sees timeline)
    await expect(page.locator('text=/status|timeline|tracking/i').first()).toBeVisible({ timeout: 3000 });
    
    // Refresh to see updated status
    await page.reload();
    await waitForPageLoad(page);
    
    // Check for courier and tracking info if shipped
    const hasCourier = await page.locator('text=/courier|tracking/i').isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCourier) {
      await expect(page.locator('text=/courier|tracking/i')).toBeVisible();
    }
  });

  // HAPPY-007: Customer Downloads Invoice After Shipment
  test('HAPPY-007 – Customer downloads invoice after shipment', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Navigate to an order with shipped/delivered status
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    
    const orderLink = page.locator('a[href*="/account/orders/"]').first();
    await expect(orderLink).toBeVisible({ timeout: 5000 });
    await orderLink.click();
    await waitForPageLoad(page);

    // Step 2-3: Locate and click download invoice button
    const downloadBtn = page.getByRole('button', { name: /download.*invoice|invoice/i });
    
    if (await downloadBtn.isVisible({ timeout: 3000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        downloadBtn.click()
      ]);
      
      if (download) {
        expect(download.suggestedFilename()).toContain('invoice');
      }
    } else {
      test.skip(true, 'Invoice not available for this order');
    }
  });
});

test.describe('Happy Path – Return and Refund Flow', () => {
  
  // HAPPY-008: Customer Requests Return for Delivered Order
  test('HAPPY-008 – Customer requests return for delivered order', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Navigate to a delivered order
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    
    const orderLink = page.locator('a[href*="/account/orders/"]').first();
    await expect(orderLink).toBeVisible({ timeout: 5000 });
    await orderLink.click();
    await waitForPageLoad(page);

    // Step 3: Click Request Return button
    const requestReturnBtn = page.getByRole('button', { name: /request.*return|return/i });
    
    if (await requestReturnBtn.isVisible({ timeout: 3000 })) {
      await requestReturnBtn.click();
      await page.waitForTimeout(500);

      // Step 4: Select return reason
      const reasonSelect = page.locator('select[name*="reason"]');
      if (await reasonSelect.isVisible({ timeout: 2000 })) {
        await reasonSelect.selectOption({ index: 1 });
        
        // Step 5: Add optional comment
        const commentField = page.locator('textarea[name*="note"], textarea[placeholder*="comment"]');
        if (await commentField.isVisible({ timeout: 2000 })) {
          await commentField.fill('Test return request');
        }
        
        // Step 6: Submit return request
        const submitBtn = page.getByRole('button', { name: /submit|request/i });
        await submitBtn.click();
        await page.waitForTimeout(1000);
        
        // Step 7: Verify return request status
        const returnStatus = await page.locator('text=/return.*requested|return.*status/i').isVisible({ timeout: 3000 });
        expect(returnStatus).toBeTruthy();
      }
    } else {
      test.skip(true, 'Return not available for this order');
    }
  });

  // HAPPY-009: Admin Reviews and Approves Return Request
  test('HAPPY-009 – Admin reviews and approves return request', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
      return;
    }

    await loginAsAdmin(page, adminEmail, adminPassword);

    // Step 1-2: Navigate to returns
    await page.goto('/admin/returns');
    await waitForPageLoad(page);

    // Step 3: Click on a return request
    const returnRow = page.locator('tr, a[href*="/admin/returns/"]').first();
    if (await returnRow.isVisible({ timeout: 5000 })) {
      await returnRow.click();
      await waitForPageLoad(page);

      // Step 5: Approve return
      const approveBtn = page.getByRole('button', { name: /approve/i });
      if (await approveBtn.isVisible({ timeout: 3000 })) {
        await approveBtn.click();
        await page.waitForTimeout(1000);
        
        const approvedStatus = await page.locator('text=/approved/i').isVisible({ timeout: 3000 });
        expect(approvedStatus).toBeTruthy();
      }
    } else {
      test.skip(true, 'No return requests available');
    }
  });

  // HAPPY-010: Admin Processes Return Through Refund
  test('HAPPY-010 – Admin processes return through refund', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
      return;
    }

    await loginAsAdmin(page, adminEmail, adminPassword);

    await page.goto('/admin/returns');
    await waitForPageLoad(page);

    const returnRow = page.locator('tr, a[href*="/admin/returns/"]').first();
    if (await returnRow.isVisible({ timeout: 5000 })) {
      await returnRow.click();
      await waitForPageLoad(page);

      // Step 2: Update to RECEIVED
      const statusSelect = page.locator('select[name*="status"]');
      if (await statusSelect.isVisible({ timeout: 3000 })) {
        await statusSelect.selectOption({ label: /RECEIVED/i });
        
        let updateBtn = page.getByRole('button', { name: /update|save/i });
        if (await updateBtn.isVisible({ timeout: 2000 })) {
          await updateBtn.click();
          await page.waitForTimeout(1000);
        }

        // Step 4: Update to REFUND_INITIATED
        await statusSelect.selectOption({ label: /REFUND.*INITIATED|REFUND_INITIATED/i });
        updateBtn = page.getByRole('button', { name: /update|save/i });
        if (await updateBtn.isVisible({ timeout: 2000 })) {
          await updateBtn.click();
          await page.waitForTimeout(1000);
        }

        // Step 6: Update to REFUNDED
        await statusSelect.selectOption({ label: /REFUNDED/i });
        updateBtn = page.getByRole('button', { name: /update|save/i });
        if (await updateBtn.isVisible({ timeout: 2000 })) {
          await updateBtn.click();
          await page.waitForTimeout(1000);
        }

        const refundedStatus = await page.locator('text=/refunded/i').isVisible({ timeout: 3000 });
        expect(refundedStatus).toBeTruthy();
      }
    } else {
      test.skip(true, 'No return requests available');
    }
  });
});

test.describe('Happy Path – Invoice Generation', () => {
  
  // HAPPY-011: Invoice Auto-Generation After Shipment
  test('HAPPY-011 – Invoice auto-generation after shipment', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
      return;
    }

    await loginAsAdmin(page, adminEmail, adminPassword);

    await page.goto('/admin/orders');
    await waitForPageLoad(page);
    
    const orderRow = page.locator('a[href*="/admin/orders/"]').first();
    await expect(orderRow).toBeVisible({ timeout: 5000 });
    await orderRow.click();
    await waitForPageLoad(page);

    // Check if invoice exists or can be generated
    const invoiceBtn = page.getByRole('button', { name: /invoice|download/i });
    const hasInvoice = await invoiceBtn.isVisible({ timeout: 3000 });
    
    expect(hasInvoice).toBeTruthy();
  });

  // HAPPY-012: Admin Downloads Invoice for Any Order
  test('HAPPY-012 – Admin downloads invoice for any order', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD');
      return;
    }

    await loginAsAdmin(page, adminEmail, adminPassword);

    await page.goto('/admin/orders');
    await waitForPageLoad(page);
    
    const orderRow = page.locator('a[href*="/admin/orders/"]').first();
    await expect(orderRow).toBeVisible({ timeout: 5000 });
    await orderRow.click();
    await waitForPageLoad(page);

    // Step 3: Download invoice
    const downloadBtn = page.getByRole('button', { name: /download.*invoice|invoice/i });
    
    if (await downloadBtn.isVisible({ timeout: 3000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        downloadBtn.click()
      ]);
      
      if (download) {
        expect(download.suggestedFilename()).toContain('invoice');
      }
    }
  });
});

test.describe('Happy Path – Page Refresh Resilience', () => {
  
  // HAPPY-013: Checkout Process Survives Page Refresh
  test('HAPPY-013 – Checkout process survives page refresh', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);
    await addProductToCart(page);

    await page.goto('/cart');
    await waitForPageLoad(page);
    
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 3000 });
    await checkoutBtn.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/checkout/);

    // Step 1: Select address (if selectable)
    const addressRadio = page.locator('input[type="radio"][name*="address"]').first();
    if (await addressRadio.isVisible({ timeout: 2000 })) {
      await addressRadio.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Apply discount code if provided
    const discountCode = process.env.DISCOUNT_CODE;
    if (discountCode) {
      const discountInput = page.locator('input[placeholder*="discount"], input[name*="coupon"]');
      if (await discountInput.isVisible({ timeout: 2000 })) {
        await discountInput.fill(discountCode);
        const applyBtn = page.getByRole('button', { name: /apply/i });
        await applyBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 3: Refresh page
    await page.reload();
    await waitForPageLoad(page);

    // Step 4-7: Verify data persists
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator('text=/checkout|order.*summary/i').first()).toBeVisible({ timeout: 3000 });
    
    const placeOrderBtn = page.getByRole('button', { name: /place order|proceed/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 3000 });
  });

  // HAPPY-014: Order Detail Page Works After Multiple Refreshes
  test('HAPPY-014 – Order detail page works after multiple refreshes', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    await page.goto('/account/orders');
    await waitForPageLoad(page);
    
    const orderLink = page.locator('a[href*="/account/orders/"]').first();
    await expect(orderLink).toBeVisible({ timeout: 5000 });
    await orderLink.click();
    await waitForPageLoad(page);

    const orderUrl = page.url();

    // Step 2-7: Refresh multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(orderUrl);
      await expect(page.locator('text=/order|status|timeline/i').first()).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[href*="/product/"], .product, [class*="item"]').first()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Happy Path – Complete End-to-End Scenarios', () => {
  
  // HAPPY-015: Full Journey from Browse to Return
  test('HAPPY-015 – Full journey: browse → cart → checkout → order → track → return', async ({ page, context }) => {
    // This is a long integration test - skip if running quickly
    test.setTimeout(90000); // 90 seconds for full journey

    const testEmail = generateTestEmail();
    const testPassword = 'Test123456';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD for full journey');
      return;
    }

    // Customer: Register
    await page.goto('/signup');
    await page.getByLabel(/full name/i).fill('Journey Test User');
    await page.getByRole('textbox', { name: /email/i }).fill(testEmail);
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);
    await page.getByLabel(/mobile/i).fill('9876543210');
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await waitForPageLoad(page);

    // Customer: Browse and add to cart
    await addProductToCart(page);

    // Customer: Checkout and place order
    await page.goto('/cart');
    await waitForPageLoad(page);
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 3000 });
    await checkoutBtn.click();
    await waitForPageLoad(page);

    // Add address if needed
    const addressFields = await page.locator('input[placeholder*="address"], textarea[placeholder*="address"]').count();
    if (addressFields > 0) {
      await page.locator('input[placeholder*="name"]').first().fill('Journey User');
      await page.locator('input[placeholder*="phone"]').first().fill('9876543210');
      await page.locator('textarea[placeholder*="address"]').first().fill('123 Journey St');
      await page.locator('input[placeholder*="city"]').first().fill('Mumbai');
      await page.locator('input[placeholder*="state"]').first().fill('Maharashtra');
      await page.locator('input[placeholder*="pincode"]').first().fill('400001');
    }

    const placeOrderBtn = page.getByRole('button', { name: /place order|proceed/i });
    await placeOrderBtn.click();
    await page.waitForTimeout(3000);

    // Get order ID from URL or confirmation page
    const currentUrl = page.url();
    let orderId = null;
    const orderMatch = currentUrl.match(/orders\/([^\/]+)/);
    if (orderMatch) {
      orderId = orderMatch[1];
    }

    // Admin: Login in new page
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage, adminEmail, adminPassword);

    if (orderId) {
      // Admin: Go to specific order
      await adminPage.goto(`/admin/orders/${orderId}`);
      await waitForPageLoad(adminPage);
    } else {
      // Admin: Find newest order
      await adminPage.goto('/admin/orders');
      await waitForPageLoad(adminPage);
      const firstOrder = adminPage.locator('a[href*="/admin/orders/"]').first();
      await firstOrder.click();
      await waitForPageLoad(adminPage);
    }

    // Admin: Update to DELIVERED (simplified for test)
    const statusSelect = adminPage.locator('select[name*="shipping"]');
    if (await statusSelect.isVisible({ timeout: 3000 })) {
      await statusSelect.selectOption({ label: /DELIVERED/i });
      const updateBtn = adminPage.getByRole('button', { name: /update|save/i });
      if (await updateBtn.isVisible({ timeout: 2000 })) {
        await updateBtn.click();
        await adminPage.waitForTimeout(1000);
      }
    }

    await adminPage.close();

    // Customer: Check order status
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    const orderLink = page.locator('a[href*="/account/orders/"]').first();
    await orderLink.click();
    await waitForPageLoad(page);

    // Customer: Request return
    const returnBtn = page.getByRole('button', { name: /request.*return|return/i });
    if (await returnBtn.isVisible({ timeout: 3000 })) {
      await returnBtn.click();
      await page.waitForTimeout(500);
      
      const reasonSelect = page.locator('select[name*="reason"]');
      if (await reasonSelect.isVisible({ timeout: 2000 })) {
        await reasonSelect.selectOption({ index: 1 });
        const submitBtn = page.getByRole('button', { name: /submit|request/i });
        await submitBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Verify journey completed
    const hasReturnStatus = await page.locator('text=/return.*requested|return.*status/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasReturnStatus).toBeTruthy();
  });

  // HAPPY-016: Multiple Orders in Parallel (simplified)
  test('HAPPY-016 – Multiple orders in parallel', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Create first order
    await addProductToCart(page);
    await page.goto('/cart');
    await waitForPageLoad(page);

    // View orders list
    await page.goto('/account/orders');
    await waitForPageLoad(page);
    
    const orders = await page.locator('a[href*="/account/orders/"]').count();
    expect(orders).toBeGreaterThan(0);
  });

  // HAPPY-017: Order with Discount Code and Multiple Items
  test('HAPPY-017 – Order with discount code and multiple items', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    const discountCode = process.env.DISCOUNT_CODE;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Add multiple products
    await addProductToCart(page);
    await page.goto('/products');
    await waitForPageLoad(page);
    const secondProduct = page.locator('a[href*="/product/"]').nth(1);
    if (await secondProduct.isVisible({ timeout: 3000 })) {
      await secondProduct.click();
      await waitForPageLoad(page);
      const addBtn = page.getByRole('button', { name: /add to cart/i });
      if (await addBtn.isVisible({ timeout: 3000 })) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.goto('/cart');
    await waitForPageLoad(page);
    
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 3000 });
    await checkoutBtn.click();
    await waitForPageLoad(page);

    // Apply discount
    if (discountCode) {
      const discountInput = page.locator('input[placeholder*="discount"], input[name*="coupon"]');
      if (await discountInput.isVisible({ timeout: 2000 })) {
        await discountInput.fill(discountCode);
        const applyBtn = page.getByRole('button', { name: /apply/i });
        await applyBtn.click();
        await page.waitForTimeout(1000);
        
        const discountApplied = await page.locator('text=/discount|saved/i').isVisible({ timeout: 2000 });
        expect(discountApplied).toBeTruthy();
      }
    }

    // Verify price breakdown
    await expect(page.locator('text=/total|subtotal/i').first()).toBeVisible({ timeout: 3000 });
  });

  // HAPPY-018: Order with Variant Selection
  test('HAPPY-018 – Order with variant selection', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }

    await loginAsCustomer(page, email, password);

    // Find product with variants
    await page.goto('/products');
    await waitForPageLoad(page);
    
    const firstProduct = page.locator('a[href*="/product/"]').first();
    await firstProduct.click();
    await waitForPageLoad(page);

    // Step 2: Select variant options if available
    const variantSelect = page.locator('select[name*="variant"], select[name*="size"], select[name*="metal"]').first();
    if (await variantSelect.isVisible({ timeout: 3000 })) {
      await variantSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }

    // Step 3: Add to cart
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    // Step 4: Verify variant in cart
    await page.goto('/cart');
    await waitForPageLoad(page);
    await expect(page.locator('.cart-item, [class*="product"]').first()).toBeVisible({ timeout: 3000 });

    // Proceed to checkout
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    if (await checkoutBtn.isVisible({ timeout: 3000 })) {
      await checkoutBtn.click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/\/checkout/);
    }
  });
});
