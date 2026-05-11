# Playwright Refactoring

## CSS / XPath Selectors

**Problem:** Tests use CSS selectors or XPath to find elements. These break on every
markup change, class name refactor, or component library update.

**Rule:** Use Playwright's **semantic locators** (role, label, text). Use
`data-testid` only as a last resort.

### Before (violation)

    await page.locator('.btn-primary.submit-form').click();
    await page.locator('#email-input').fill('user@test.com');
    await page.locator('div.order-list > div:nth-child(2) > span.price').textContent();

### After

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByRole('listitem').filter({ hasText: 'Widget' }).getByText('$').textContent();

---

## Manual Wait Timeouts

**Problem:** Tests use `page.waitForTimeout(ms)` to wait for elements or state
changes. This is fragile — too short causes flakiness, too long wastes time.

**Rule:** Use Playwright's **auto-waiting** and explicit condition waits. Never
use `waitForTimeout`.

### Before (violation)

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);  // hope the save completes in 2 seconds
    const message = await page.getByRole('alert').textContent();
    expect(message).toContain('Saved');

### After

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert')).toHaveText('Saved');
    // auto-retries until the assertion passes or timeout

---

## UI-Based Test Setup

**Problem:** Tests click through the UI to create test data (register user, create
order, fill forms) before testing the actual behavior. Setup takes longer than the
test and multiplies flakiness.

**Rule:** Use **API calls** for test data setup. Reserve UI interactions for the
behavior being tested.

### Before (violation)

    test('should display order in dashboard', async ({ page }) => {
      // 30 seconds of UI clicking just to set up data
      await page.goto('/register');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Register' }).click();
      await page.goto('/orders/new');
      await page.getByLabel('Product').selectOption('Widget');
      await page.getByRole('button', { name: 'Create Order' }).click();

      // The actual test — 2 seconds
      await page.goto('/dashboard');
      await expect(page.getByText('Widget')).toBeVisible();
    });

### After

    test('should display order in dashboard', async ({ page, request }) => {
      // API setup — fast, reliable
      const token = await apiLogin(request, 'test@example.com', 'password');
      await apiCreateOrder(request, token, { product: 'Widget' });

      // The actual test
      await page.goto('/dashboard');
      await expect(page.getByText('Widget')).toBeVisible();
    });

---

## Tests Dependent on Execution Order

**Problem:** Tests share state — one test creates data that another test reads.
Running tests in isolation or in parallel causes failures.

**Rule:** Each test sets up its own state and tears it down. Tests are
**fully independent**.

### Before (violation)

    test('should create order', async ({ page }) => {
      await page.goto('/orders/new');
      await page.getByLabel('Product').fill('Widget');
      await page.getByRole('button', { name: 'Create' }).click();
      // Creates order that next test depends on
    });

    test('should show order in list', async ({ page }) => {
      await page.goto('/orders');
      // FAILS if previous test didn't run or failed
      await expect(page.getByText('Widget')).toBeVisible();
    });

### After

    test('should show order in list', async ({ page, request }) => {
      // Own setup
      await apiCreateOrder(request, authToken, { product: 'Widget' });

      await page.goto('/orders');
      await expect(page.getByText('Widget')).toBeVisible();
    });

---

## Refactoring Checklist

- All selectors use role/label/text — no CSS or XPath
- No `waitForTimeout()` — auto-wait and `expect` assertions used
- Test data created via API calls, not UI interactions
- Tests are fully independent — can run in any order or in parallel
- Page Objects used for flows that appear in multiple tests
- Authentication reused via `storageState`
