# 📋 Testing Guide
## Aldorado Jewells – Manual Testing Workflow & Execution Guide

**Purpose**: This document provides a comprehensive guide on how to execute the manual testing framework for Aldorado Jewells e-commerce platform.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Test Files Overview](#test-files-overview)
3. [Testing Workflow](#testing-workflow)
4. [Test Execution Flow](#test-execution-flow)
5. [Testing Scenarios](#testing-scenarios)
6. [Best Practices](#best-practices)
7. [Test Reporting](#test-reporting)

---

## Overview

This testing framework consists of **10 test files** containing **211 manual test cases** covering all aspects of the Aldorado Jewells platform. All tests are designed to be executed manually by a solo developer without requiring a dedicated QA team.

### Key Principles

- ✅ **Manual Execution**: All tests are designed for manual execution
- ✅ **Clear Instructions**: Each test case has step-by-step instructions
- ✅ **Comprehensive Coverage**: Tests cover frontend, backend, admin, and integration
- ✅ **Real-World Scenarios**: Tests reflect actual user journeys
- ✅ **No Automation Required**: No coding or automation tools needed

---

## Test Files Overview

### 1. **smoke-tests.md** (15 tests | 15-20 min)
**Purpose**: Quick validation that core functionality works  
**When to Run**: After every deployment, before major releases  
**Priority**: 🔴 **CRITICAL**

**Covers**:
- App load (frontend & admin)
- Authentication (login/logout)
- Product listing
- Cart add/remove
- Order placement
- Admin order visibility

---

### 2. **regression-tests.md** (20 tests | 45-60 min)
**Purpose**: Ensure existing features still work after changes  
**When to Run**: Before major releases, after significant code changes  
**Priority**: 🔴 **HIGH**

**Covers**:
- Order lifecycle enforcement
- Page reload safety
- Shipping status updates
- Invoice download
- Return request rules
- Data integrity

---

### 3. **negative-tests.md** (25 tests | 60-90 min)
**Purpose**: Validate security and error handling  
**When to Run**: Before security audits, after auth changes  
**Priority**: 🟡 **MEDIUM**

**Covers**:
- Unauthorized access prevention
- Token validation
- Invalid input handling
- State machine enforcement
- Security measures

---

### 4. **happy-path-tests.md** (18 tests | 90-120 min)
**Purpose**: Validate complete end-to-end user journeys  
**When to Run**: For major releases, new feature integration  
**Priority**: 🔴 **HIGH**

**Covers**:
- Complete customer order journey
- Admin fulfillment journey
- Shipping and delivery flow
- Return and refund flow
- Invoice generation

---

### 5. **admin-product-tests.md** (25 tests | 90-120 min)
**Purpose**: Validate admin product management features  
**When to Run**: After product management changes  
**Priority**: 🟡 **MEDIUM**

**Covers**:
- Product CRUD operations
- Variant management
- Image upload and management
- Bulk import/export
- Pricing rules

---

### 6. **product-browsing-tests.md** (22 tests | 60-75 min)
**Purpose**: Validate customer product discovery features  
**When to Run**: After UI/product page changes  
**Priority**: 🟡 **MEDIUM**

**Covers**:
- Product listing and display
- Category filtering
- Product search
- Product detail page
- Variant selection

---

### 7. **address-management-tests.md** (20 tests | 45-60 min)
**Purpose**: Validate address CRUD operations  
**When to Run**: After address-related changes  
**Priority**: 🟡 **MEDIUM**

**Covers**:
- Address creation and validation
- Address editing and deletion
- Default address management
- Checkout integration

---

### 8. **discount-coupon-tests.md** (21 tests | 60-75 min)
**Purpose**: Validate discount code functionality  
**When to Run**: Before promotions, after discount changes  
**Priority**: 🟡 **MEDIUM**

**Covers**:
- Discount code application
- Code validation and limits
- Admin discount management
- Discount calculations

---

### 9. **integration-tests.md** (25 tests | 90-120 min)
**Purpose**: Validate API endpoints and system integration  
**When to Run**: After API changes, backend updates  
**Priority**: 🔴 **HIGH**

**Covers**:
- API authentication
- Cart and order APIs
- Payment integration
- Admin APIs
- Error handling

---

### 10. **ui-ux-tests.md** (25 tests | 75-90 min)
**Purpose**: Validate user interface and experience  
**When to Run**: After UI changes, design updates  
**Priority**: 🟢 **LOW**

**Covers**:
- Navigation and layout
- Responsive design
- Form usability
- Accessibility
- Performance

---

## Testing Workflow

### Daily Testing (Quick Checks)

**Time Required**: 15-20 minutes  
**Frequency**: After every code change or deployment

**Steps**:
1. Run **smoke-tests.md** (15 tests)
2. Focus on critical paths:
   - App loads
   - Login works
   - Can add to cart
   - Can place order
   - Admin can see orders

**Stop Criteria**: If any smoke test fails, fix immediately before proceeding.

---

### Pre-Release Testing (Comprehensive)

**Time Required**: 4-6 hours  
**Frequency**: Before major releases or deployments

**Recommended Order**:

#### Phase 1: Critical Paths (2-3 hours)
1. **smoke-tests.md** (15-20 min) - Quick validation
2. **happy-path-tests.md** (90-120 min) - End-to-end journeys
3. **regression-tests.md** (45-60 min) - Existing features

#### Phase 2: Feature-Specific (1-2 hours)
4. **integration-tests.md** (90-120 min) - API validation
5. **admin-product-tests.md** (90-120 min) - Admin features (if changed)
6. **product-browsing-tests.md** (60-75 min) - Customer features (if changed)

#### Phase 3: Security & Polish (1 hour)
7. **negative-tests.md** (60-90 min) - Security validation
8. **ui-ux-tests.md** (75-90 min) - UI validation (optional)

---

### Feature-Specific Testing

When working on a specific feature, run relevant test files:

#### Product Management Changes
- `admin-product-tests.md`
- `product-browsing-tests.md`
- `smoke-tests.md` (product listing)

#### Checkout/Payment Changes
- `happy-path-tests.md` (order journey)
- `integration-tests.md` (payment APIs)
- `regression-tests.md` (order lifecycle)
- `smoke-tests.md` (order placement)

#### Authentication/Security Changes
- `negative-tests.md`
- `integration-tests.md` (auth APIs)
- `smoke-tests.md` (login/logout)

#### UI/Design Changes
- `ui-ux-tests.md`
- `product-browsing-tests.md`
- `smoke-tests.md` (app load)

---

## Test Execution Flow

### Step-by-Step Execution Process

#### 1. **Preparation**
   - [ ] Ensure backend server is running
   - [ ] Ensure frontend is running
   - [ ] Database is accessible
   - [ ] Test data is available (products, users, orders)
   - [ ] Browser developer tools ready (for API tests)

#### 2. **Environment Setup**
   - [ ] Clear browser cache (if needed)
   - [ ] Use incognito/private window (optional, for clean state)
   - [ ] Have test accounts ready:
     - Customer account
     - Admin account
   - [ ] Have test products available

#### 3. **Test Execution**
   For each test case:
   - [ ] Read the test case completely
   - [ ] Verify preconditions are met
   - [ ] Execute steps in order
   - [ ] Document actual results
   - [ ] Compare with expected results
   - [ ] Mark as Pass/Fail/Blocked

#### 4. **Issue Documentation**
   If a test fails:
   - [ ] Note the test ID
   - [ ] Document actual behavior
   - [ ] Take screenshots (if applicable)
   - [ ] Note browser/device information
   - [ ] Document steps to reproduce

#### 5. **Retesting**
   After fixes:
   - [ ] Re-run failed tests
   - [ ] Verify fixes work
   - [ ] Run related tests to ensure no regression

---

## Testing Scenarios

### Scenario 1: New Feature Development

**When**: Developing a new feature (e.g., new payment method)

**Testing Flow**:
1. **During Development**:
   - Run `smoke-tests.md` to ensure nothing broke
   - Run related feature tests as you build

2. **Feature Complete**:
   - Run `happy-path-tests.md` (relevant tests)
   - Run `integration-tests.md` (if API changes)
   - Run `regression-tests.md` (ensure no breakage)

3. **Before Merge**:
   - Run full `smoke-tests.md`
   - Run `negative-tests.md` (security validation)

---

### Scenario 2: Bug Fix

**When**: Fixing a reported bug

**Testing Flow**:
1. **Reproduce Bug**:
   - Use relevant test case to reproduce
   - Document steps

2. **Fix Implementation**:
   - Make code changes
   - Run specific test case that failed

3. **Verify Fix**:
   - Re-run the test case
   - Run related test cases
   - Run `regression-tests.md` (ensure no new issues)

---

### Scenario 3: Pre-Production Deployment

**When**: Ready to deploy to production

**Testing Flow**:
1. **Critical Paths** (Must Pass):
   - `smoke-tests.md` - All tests must pass
   - `happy-path-tests.md` - All critical journeys must pass
   - `regression-tests.md` - All existing features must work

2. **Integration** (Should Pass):
   - `integration-tests.md` - All API tests should pass
   - `negative-tests.md` - Security tests should pass

3. **Feature-Specific** (As Needed):
   - Run tests for features that changed
   - `admin-product-tests.md` (if product features changed)
   - `product-browsing-tests.md` (if customer features changed)
   - `address-management-tests.md` (if address features changed)
   - `discount-coupon-tests.md` (if discount features changed)

4. **Polish** (Optional):
   - `ui-ux-tests.md` - UI validation (if time permits)

**Deployment Decision**:
- ✅ **Deploy**: If all critical tests pass
- ⚠️ **Deploy with Caution**: If minor non-critical tests fail
- ❌ **Do Not Deploy**: If any critical test fails

---

### Scenario 4: Security Audit

**When**: Preparing for security review or audit

**Testing Flow**:
1. **Security Focus**:
   - Run `negative-tests.md` - All 25 tests
   - Run `integration-tests.md` (auth and security APIs)
   - Run `regression-tests.md` (data isolation tests)

2. **Documentation**:
   - Document all security test results
   - Note any security concerns
   - Document security measures in place

---

### Scenario 5: Performance Check

**When**: Checking application performance

**Testing Flow**:
1. **Performance Tests**:
   - Run `ui-ux-tests.md` (performance section)
   - Run `smoke-tests.md` (check load times)
   - Run `product-browsing-tests.md` (check page load)

2. **Documentation**:
   - Note page load times
   - Document slow pages
   - Note any performance issues

---

## Best Practices

### 1. **Test Organization**

- **Group Related Tests**: Run tests for related features together
- **Start with Smoke Tests**: Always start with smoke tests
- **End with Regression**: Always end with regression tests
- **Document Results**: Keep a test execution log

### 2. **Test Data Management**

- **Use Test Accounts**: Don't use production accounts
- **Clean Test Data**: Clean up test data after testing
- **Consistent Data**: Use same test data across test runs
- **Realistic Data**: Use realistic test scenarios

### 3. **Test Execution**

- **Follow Steps Exactly**: Don't skip steps
- **Verify Preconditions**: Ensure preconditions are met
- **Document Deviations**: Note any deviations from expected
- **Take Screenshots**: Capture evidence of failures

### 4. **Issue Reporting**

When a test fails, document:
- **Test ID**: Which test case failed
- **Actual Result**: What actually happened
- **Expected Result**: What should have happened
- **Steps to Reproduce**: How to reproduce the issue
- **Screenshots**: Visual evidence
- **Environment**: Browser, device, OS

### 5. **Test Maintenance**

- **Update Tests**: Update tests when features change
- **Remove Obsolete Tests**: Remove tests for removed features
- **Add New Tests**: Add tests for new features
- **Review Regularly**: Review test coverage regularly

---

## Test Reporting

### Test Execution Log Template

Create a simple log file (Excel, Google Sheets, or text file) with:

| Test ID | Test Title | Status | Notes | Date | Tester |
|---------|------------|--------|-------|------|--------|
| SMOKE-001 | Frontend Loads | ✅ Pass | - | 2025-01-19 | Developer |
| SMOKE-002 | Admin Loads | ✅ Pass | - | 2025-01-19 | Developer |
| SMOKE-003 | Customer Login | ❌ Fail | Token not returned | 2025-01-19 | Developer |

### Status Codes

- ✅ **Pass**: Test passed as expected
- ❌ **Fail**: Test failed, issue found
- ⚠️ **Blocked**: Test cannot be executed (missing data, environment issue)
- 🔄 **Retest**: Test needs to be re-run after fix
- ⏭️ **Skip**: Test skipped (not applicable, out of scope)

### Test Summary Report

After test execution, create a summary:

```
Test Execution Summary
Date: 2025-01-19
Test Suite: Pre-Release Testing
Total Tests: 78
Passed: 75
Failed: 2
Blocked: 1
Pass Rate: 96.2%

Critical Issues: 1
- SMOKE-003: Customer login not working

Non-Critical Issues: 1
- UI-024: Page load time slightly slow

Recommendation: Fix critical issue before deployment.
```

---

## Quick Reference

### Test Execution Time Estimates

| Test File | Tests | Time | Priority |
|-----------|-------|------|----------|
| Smoke Tests | 15 | 15-20 min | 🔴 Critical |
| Regression Tests | 20 | 45-60 min | 🔴 High |
| Happy Path Tests | 18 | 90-120 min | 🔴 High |
| Integration Tests | 25 | 90-120 min | 🔴 High |
| Admin Product Tests | 25 | 90-120 min | 🟡 Medium |
| Product Browsing Tests | 22 | 60-75 min | 🟡 Medium |
| Address Management Tests | 20 | 45-60 min | 🟡 Medium |
| Discount/Coupon Tests | 21 | 60-75 min | 🟡 Medium |
| Negative Tests | 25 | 60-90 min | 🟡 Medium |
| UI/UX Tests | 25 | 75-90 min | 🟢 Low |

**Total**: 211 tests | ~10-12 hours for complete suite

### Minimum Testing Before Deployment

**Must Run** (1-2 hours):
- ✅ Smoke Tests (15-20 min)
- ✅ Happy Path Tests - Critical journeys (30-45 min)
- ✅ Regression Tests - Core features (30-45 min)

**Should Run** (2-3 hours):
- ✅ Integration Tests (90-120 min)
- ✅ Negative Tests - Security (30-45 min)

---

## Testing Checklist

### Before Starting Testing

- [ ] Backend server is running
- [ ] Frontend is running
- [ ] Database is accessible
- [ ] Test accounts are ready
- [ ] Test products are available
- [ ] Browser developer tools are ready
- [ ] Test execution log is prepared

### During Testing

- [ ] Follow test steps exactly
- [ ] Verify preconditions before each test
- [ ] Document actual results
- [ ] Take screenshots of failures
- [ ] Note any deviations

### After Testing

- [ ] Document all test results
- [ ] Create test summary report
- [ ] Report critical issues immediately
- [ ] Plan fixes for failed tests
- [ ] Schedule retesting after fixes

---

## Support & Maintenance

### Updating Tests

When features change:
1. Identify affected test files
2. Update test cases to reflect new behavior
3. Add new test cases for new features
4. Remove obsolete test cases
5. Update this guide if workflow changes

### Adding New Tests

When adding new features:
1. Identify appropriate test file
2. Follow existing test case format
3. Add test ID (sequential)
4. Include all required sections
5. Update test count in file summary

---

## Conclusion

This testing framework provides comprehensive coverage for the Aldorado Jewells platform. By following this guide, you can ensure quality and reliability without a dedicated QA team.

**Remember**:
- Start with smoke tests
- Focus on critical paths
- Document everything
- Fix critical issues before deployment
- Regular testing prevents major issues

**Happy Testing! 🧪**

---

*Last Updated: 2025-01-19*  
*Total Test Cases: 211*  
*Test Files: 10*
