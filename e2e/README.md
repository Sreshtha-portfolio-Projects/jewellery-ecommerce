# E2E Tests (Playwright)

Automated E2E tests for Aldorado Jewells, mapped from the manual test flows in `tests/*.md`.

## Prerequisites

- Node.js 18+
- Frontend and backend running (e.g. frontend on port 5173, backend on your API port)

## Setup

```bash
cd e2e
npm install
npx playwright install
```

Optional: copy `.env.example` to `.env` and set:

- `BASE_URL` – frontend URL (default `http://localhost:5173`)
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` – for customer login tests (SMOKE-003)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` – for admin login tests (SMOKE-004)

Variables from `.env` are loaded automatically by Playwright config (via `dotenv`).

## Run tests

```bash
# All e2e tests
npm test

# Smoke only
npm run test:smoke

# Happy path tests only
npx playwright test happy-path.spec.js

# Specific test by ID (e.g. HAPPY-001)
npx playwright test happy-path.spec.js -g "HAPPY-001"

# With UI (interactive)
npm run test:ui

# Headed browser (see the browser)
npm run test:headed
```

## Mapping to manual tests

| Spec file           | Manual test file              | Test IDs        | Count |
|---------------------|-------------------------------|-----------------|-------|
| `smoke.spec.js`     | `tests/smoke-tests.md`        | SMOKE-001 … 015 | 8     |
| `happy-path.spec.js`| `tests/happy-path-tests.md`   | HAPPY-001 … 018 | 18    |

Add more spec files (e.g. `discount-coupon.spec.js`, `address-management.spec.js`) and implement tests from the corresponding `tests/*.md` files. Keep the same Test ID in the test name for traceability.

## Process

1. Start app (frontend + backend).
2. Run `cd e2e && npx playwright test`.
3. Add new tests by following the pattern in `smoke.spec.js` and referencing the step/expected result from the `.md` files.

See **`tests/AUTOMATION_GUIDE.md`** for the full automation process and recommendations.
