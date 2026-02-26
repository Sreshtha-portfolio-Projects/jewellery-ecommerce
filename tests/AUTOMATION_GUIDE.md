# 🤖 Test Automation Guide
## Aldorado Jewells – From Manual Test Flows to Automated E2E

**Purpose**: How to automate your existing manual test flows (211 test cases across 10 files) without starting from scratch.

---

## Do You Need a New Repo?

**No.** Keep automation in the **same repository** as your app.

| Approach | Pros | Cons |
|----------|------|------|
| **Same repo** ✅ | Single place for code + tests, one CI pipeline, tests stay in sync with app | Repo gets slightly larger |
| **Separate repo** | Repo stays smaller | Two repos to maintain, tests can drift from app versions |

**Recommendation**: Add an `e2e/` (or `tests/e2e/`) folder in this repo and put all automated E2E tests there. Your existing `tests/*.md` files remain the **source of truth** for test design; automation **implements** those flows.

---

## Which Language to Use?

Use **JavaScript** or **TypeScript** so it matches your stack (Node.js backend, React frontend).

- **JavaScript**: Simpler, no extra build step, quick to start.
- **TypeScript**: Better editor support and fewer typos as the suite grows.

**Recommendation**: Start with **JavaScript**. You can migrate to TypeScript later if you want.

---

## Which E2E Tool to Use?

| Tool | Best for | Pros | Cons |
|------|-----------|------|------|
| **Playwright** ✅ | Modern web apps, React, cross-browser | Fast, great API, auto-wait, trace/debug, one config for all browsers | Newer (but very mature) |
| **Cypress** | Frontend-heavy teams | Popular, good DX, dashboard | Slower, different model (no multi-tab), licensing for advanced features |
| **Selenium** | Legacy or many languages | Universal, many languages | More boilerplate, slower, flakier |

**Recommendation**: **Playwright**. It fits React/Vite apps well, runs quickly, and your test flows (navigate, click, fill, assert) map directly to Playwright APIs.

---

## The Whole Process (Step by Step)

### 1. Add E2E in This Repo

- Create a folder: `e2e/` at the repo root (or under `tests/e2e/`).
- Add a dedicated `package.json` for E2E (so Playwright and its dependencies don’t mix with frontend/backend).
- Install Playwright and browsers (one-time):

  ```bash
  cd e2e
  npm init -y
  npx playwright install
  ```

### 2. Map Test IDs to Specs

Your manual tests use **Test ID** (e.g. `SMOKE-001`, `DISC-001`). Keep that mapping clear:

- One **spec file per area** (e.g. `smoke.spec.js`, `discount-coupon.spec.js`, `address-management.spec.js`).
- Inside each file, one `test()` (or `it()`) per **Test ID**, and name the test with the ID + title so reports are readable.

Example:

- `tests/smoke-tests.md` → `e2e/smoke.spec.js` with tests for SMOKE-001 … SMOKE-015.
- `tests/discount-coupon-tests.md` → `e2e/discount-coupon.spec.js` for DISC-001 … DISC-021.

### 3. Implement One Flow at a Time

- Start with **smoke tests** (critical path): app load, login, products, cart, order, admin orders.
- For each manual test:
  1. Open the corresponding `.md` file.
  2. Translate **Steps** into Playwright calls (`page.goto()`, `page.click()`, `page.fill()`, etc.).
  3. Translate **Expected Result** into `expect()` assertions.
  4. Use **Preconditions** to decide if you need to log in first, add to cart, etc. (reuse helpers or `beforeEach`).

### 4. Use Config and Env for URLs/Credentials

- Put **base URL** (e.g. `http://localhost:5173`) in `playwright.config.js` or in env (e.g. `BASE_URL`).
- Never hardcode real passwords. Use env vars (e.g. `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) and a `.env` file that is in `.gitignore`.

### 5. Run Locally and in CI

- **Local**: Start frontend + backend, then run:

  ```bash
  cd e2e && npx playwright test
  ```

- **CI** (e.g. GitHub Actions): Add a job that installs deps, starts app (and DB if needed), then runs `npx playwright test`. Use `playwright install --with-deps` in CI for browser binaries.

### 6. Prioritise and Expand

- **Phase 1**: Smoke tests (15 tests) – run on every deploy.
- **Phase 2**: Regression + happy path + discount/coupon (high-value flows).
- **Phase 3**: Remaining areas (admin product, address, integration, negative, UI/UX) as needed.

You don’t have to automate all 211 at once; automate by **priority** and **stability** of the feature.

---

## Summary

| Question | Answer |
|----------|--------|
| New repo? | **No** – same repo, e.g. `e2e/` folder. |
| Language? | **JavaScript** (or TypeScript later). |
| Tool? | **Playwright** for browser E2E. |
| Process? | Map Test IDs → one spec file per area → implement from smoke → add config/env → run locally + CI → expand by priority. |

Your existing `tests/*.md` files stay as the **documentation and design** of each test; the **e2e specs** are the executable version of those flows.

---

## Next Steps

1. Use the `e2e/` setup already added in this repo (see `e2e/README.md`).
2. Run the example smoke tests: `cd e2e && npx playwright test`.
3. Add more tests by copying the pattern in `e2e/smoke.spec.js` and mapping from your `tests/smoke-tests.md` (and later other `.md` files).

For more detail on a specific test file (e.g. discount-coupon or address-management), implement one Test ID end-to-end, then repeat the same pattern for the rest.
