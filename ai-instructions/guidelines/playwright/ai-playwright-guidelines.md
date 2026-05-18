AI Playwright Guidelines (Claude / LLM)
Playwright 1.40+ | TypeScript | Page Objects | CI | Visual testing

These guidelines are loaded by an AI when writing or refactoring end-to-end
tests with Playwright.
Goal: stable selectors, independent tests, efficient parallel execution, and
reliable CI integration.

---

0. Defaults

- Playwright 1.40+
- TypeScript for test authoring
- Chromium as primary browser, cross-browser in CI
- Page Object Model for complex flows
- Traces captured on failure

---

1. Selector Priority

Use Playwright's built-in locators in this order:

1. `getByRole('button', { name: 'Submit' })` — best: accessible and stable
2. `getByLabel('Email')` — form inputs with labels
3. `getByPlaceholder('Search...')` — inputs without labels
4. `getByText('Welcome back')` — visible text content
5. `getByAltText('Company logo')` — images
6. `getByTitle('Close dialog')` — title attribute
7. `getByTestId('checkout-form')` — last resort: data-testid attribute

Rules:
- Never use CSS selectors for elements that have accessible names
- Never use XPath
- Never use auto-generated class names, dynamic IDs, or framework internals
- Combine locators for precision: `page.getByRole('listitem').filter({ hasText: 'Product A' })`
- Add `data-testid` only when no semantic locator exists

---

2. Action Patterns

    // Click
    await page.getByRole('button', { name: 'Place Order' }).click();

    // Fill form
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('secret123');

    // Select
    await page.getByLabel('Country').selectOption('US');

    // Upload
    await page.getByLabel('Avatar').setInputFiles('photo.jpg');

    // Keyboard
    await page.getByLabel('Search').press('Enter');

Rules:
- Playwright auto-waits for elements to be actionable — do not add manual waits
- Use `.fill()` not `.type()` — fill clears the field first and is faster
- Use `.click()` not `.dispatchEvent()` — click simulates real user behavior
- Chain actions naturally — Playwright handles timing
- If a test is flaky, fix the selector or add `await expect(locator).toBeVisible()` — never `waitForTimeout`

---

3. Assertion Patterns

    // Element assertions (auto-retry)
    await expect(page.getByRole('heading')).toHaveText('Order Confirmed');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();

    // Page assertions
    await expect(page).toHaveURL('/dashboard');
    await expect(page).toHaveTitle('Dashboard — MyApp');

    // Count
    await expect(page.getByRole('listitem')).toHaveCount(5);

    // Visual
    await expect(page.getByTestId('chart')).toHaveScreenshot('revenue-chart.png');

Rules:
- Use Playwright's `expect` — it auto-retries until the assertion passes or times out
- Assert on user-visible outcomes — not internal state or network requests
- Use `toHaveScreenshot()` for visual regression testing
- Use `toHaveURL()` after navigation — not `waitForURL()` as an assertion
- Set custom timeout for slow operations: `await expect(locator).toBeVisible({ timeout: 10000 })`

---

4. Page Object Model

    // pages/CheckoutPage.ts
    export class CheckoutPage {
      constructor(private page: Page) {}

      async fillShippingAddress(address: Address) {
        await this.page.getByLabel('Street').fill(address.street);
        await this.page.getByLabel('City').fill(address.city);
        await this.page.getByLabel('Zip').fill(address.zip);
      }

      async selectPaymentMethod(method: string) {
        await this.page.getByLabel('Payment').selectOption(method);
      }

      async placeOrder(): Promise<ConfirmationPage> {
        await this.page.getByRole('button', { name: 'Place Order' }).click();
        return new ConfirmationPage(this.page);
      }
    }

    // tests/checkout.spec.ts
    test('complete checkout', async ({ page }) => {
      const checkout = new CheckoutPage(page);
      await checkout.fillShippingAddress(testAddress);
      await checkout.selectPaymentMethod('credit-card');
      const confirmation = await checkout.placeOrder();
      await expect(confirmation.heading).toHaveText('Order Confirmed');
    });

Rules:
- One Page Object per logical page or major component
- Methods return new Page Objects when navigation occurs
- Keep selectors inside Page Objects — tests use methods only
- Page Objects encapsulate actions AND assertions about page state
- Do not extend Page Objects with inheritance — compose instead

---

5. Test Isolation

    // Global setup for authentication
    // auth.setup.ts
    setup('authenticate', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.context().storageState({ path: '.auth/user.json' });
    });

    // Use saved auth in tests
    test.use({ storageState: '.auth/user.json' });

Rules:
- Each test starts with a clean state — no dependency on test execution order
- Use API calls for test data setup — do not click through the UI
- Use `storageState` to share authentication across tests (faster than login per test)
- Use `test.use({ storageState: ... })` per file for role-specific sessions
- Parallelize by default — `fullyParallel: true` in config

---

6. CI Configuration

    // playwright.config.ts
    export default defineConfig({
      testDir: './e2e',
      fullyParallel: true,
      retries: process.env.CI ? 2 : 0,
      workers: process.env.CI ? 4 : undefined,
      reporter: process.env.CI ? 'html' : 'list',
      use: {
        baseURL: 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
      },
      projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ],
    });

Rules:
- Retries in CI (2-3) to handle transient failures
- Traces on failure for debugging — `retain-on-failure`
- Multiple browsers in CI, single browser in local dev
- Pin Playwright version — browser versions are tied to it
- Use `webServer` config to start the app automatically in CI

---

7. Anti-Patterns to Avoid

- `page.waitForTimeout(ms)` — use auto-wait or explicit conditions instead
- `page.locator('.css-class')` — use semantic locators
- Tests that depend on other tests' state — each test is independent
- Clicking through the UI for setup — use API calls
- Hardcoded URLs in tests — use `baseURL` from config
- Screenshots as assertions for everything — use element-level assertions

---

8. Self-check before finishing

1. Selectors use role/label/text — not CSS or XPath
2. No `waitForTimeout()` — Playwright auto-waits
3. Tests are independent — no shared mutable state
4. Setup done via API, not UI clicks
5. Page Objects used for reusable flows
6. Authentication reused via `storageState`
7. CI config includes retries and traces on failure
8. Cross-browser testing in CI
