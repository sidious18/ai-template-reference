# Testing Guide: Playwright

Use this guide for end-to-end and integration testing with Playwright.

## Stack Assumptions

- Playwright 1.40+
- TypeScript for test authoring
- Page Object Model for complex flows
- CI integration (GitHub Actions, GitLab CI, or similar)

## Structure Rules

- Tests in `e2e/` or `tests/` directory, separate from unit tests
- File naming: `{feature}.spec.ts`
- Group by user flow, not by page: `checkout.spec.ts`, not `cart-page.spec.ts`
- Use `test.describe` for grouping related scenarios
- Keep tests independent — no test should depend on another test's state

## Selector Rules

- Prefer user-facing locators in this order:
  1. `getByRole('button', { name: 'Submit' })` — best
  2. `getByLabel('Email')` — form inputs
  3. `getByText('Welcome')` — visible text
  4. `getByTestId('checkout-form')` — last resort
- Never use CSS selectors or XPath for elements that have accessible names
- Never use auto-generated class names or dynamic IDs
- Use `data-testid` only when no semantic locator exists

## Action Rules

- Use Playwright's built-in actions — they auto-wait for elements:

      await page.getByRole('button', { name: 'Submit' }).click();
      await page.getByLabel('Email').fill('user@example.com');

- Do not add manual `waitForTimeout()` — Playwright auto-waits
- Use `expect(locator).toBeVisible()` before interacting when debugging flaky tests
- Use `page.waitForURL()` or `page.waitForResponse()` for navigation assertions
- Fill forms field by field — do not set values programmatically

## Assertion Rules

- Use Playwright's `expect` with auto-retry:

      await expect(page.getByRole('heading')).toHaveText('Order Confirmed');
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page).toHaveURL('/dashboard');

- Assertions auto-retry until timeout — no manual polling needed
- Assert on user-visible outcomes, not implementation state
- Use `toHaveScreenshot()` for visual regression tests

## Page Object Rules

- Use Page Objects for flows that span multiple tests:

      class CheckoutPage {
        constructor(private page: Page) {}
        async fillShipping(address: Address) {
          await this.page.getByLabel('Street').fill(address.street);
          await this.page.getByLabel('City').fill(address.city);
        }
        async submit() {
          await this.page.getByRole('button', { name: 'Place Order' }).click();
        }
      }

- Page Objects encapsulate selectors and actions — tests read like user stories
- One Page Object per logical page or component
- Return new Page Objects for navigation: `submit()` returns `ConfirmationPage`

## Test Isolation Rules

- Each test starts with a clean state — use `test.beforeEach` for login/setup
- Use API calls for setup (create test data) — do not click through the UI for setup
- Use `storageState` to reuse authentication across tests
- Use `test.use({ storageState: ... })` per test file for role-specific sessions
- Clean up test data after the suite if using shared environments

## CI Rules

- Run with `--workers=4` or higher for parallelism
- Use `--retries=2` in CI to handle transient failures
- Capture traces on failure: `trace: 'retain-on-failure'`
- Use `--reporter=html` for CI reports
- Pin the browser version in `playwright.config.ts`

## Workflow

1. Identify the user flow to test
2. Write the test as user actions + assertions
3. Extract Page Objects if the flow is reused
4. Run locally: `npx playwright test`
5. Run in CI with retries and trace capture
6. Review flaky tests — fix selectors or add proper waits

## Self-Check

1. Selectors use role/label/text — not CSS or XPath
2. No manual `waitForTimeout()` — auto-wait is used
3. Tests are independent — no shared state between tests
4. Test data created via API, not UI clicks
5. Page Objects used for reusable flows
6. CI captures traces on failure
