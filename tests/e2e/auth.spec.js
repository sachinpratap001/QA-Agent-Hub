const { test, expect } = require('@playwright/test');

const TEST_EMAIL = process.env.TEST_EMAIL || 'test.qa@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!';

test.describe('Medusa Storefront - Authentication Flow', () => {

  test('1. Page loads and shows login/account link', async ({ page }) => {
    await page.goto('/');

    const accountLink = page.locator(
      'a[data-testid="nav-account-link"], a[href*="/account"], a:has-text("Account"), a:has-text("Sign in")'
    ).first();

    await expect(accountLink).toBeVisible();
  });

  test('2. User can navigate to login page', async ({ page }) => {
    await page.goto('/');

    const accountLink = page.locator(
      'a[data-testid="nav-account-link"], a[href*="/account"], a:has-text("Account"), a:has-text("Sign in")'
    ).first();

    await accountLink.click();
    await page.waitForURL(/\/account/);

    await expect(page).toHaveURL(/\/account/);
    const loginHeaderOrInput = page.locator(
      'h1:has-text("Welcome"), h1:has-text("Sign in"), input[name="email"], input[type="email"]'
    ).first();
    await expect(loginHeaderOrInput).toBeVisible();
  });

  test('3. User can login with valid credentials', async ({ page }) => {
    await page.goto('/account/login');
    // If /account/login redirects to /account, page handles it
    if (!page.url().includes('/account')) {
      await page.goto('/account');
    }

    const emailInput = page.locator(
      'input[data-testid="email-input"], input[name="email"], input[type="email"]'
    ).first();
    const passwordInput = page.locator(
      'input[data-testid="password-input"], input[name="password"], input[type="password"]'
    ).first();
    const submitButton = page.locator(
      'button[data-testid="sign-in-button"], button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")'
    ).first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await submitButton.click();

    // Verify successful login redirect to account dashboard/overview
    await page.waitForURL(/\/account(\/overview)?/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/account/);

    const accountOverview = page.locator(
      '[data-testid="overview-page-wrapper"], text="Overview", text="Profile", button:has-text("Log out"), button:has-text("Sign out")'
    ).first();
    await expect(accountOverview).toBeVisible();
  });

  test('4. Login fails with invalid password', async ({ page }) => {
    await page.goto('/account/login');
    if (!page.url().includes('/account')) {
      await page.goto('/account');
    }

    const emailInput = page.locator(
      'input[data-testid="email-input"], input[name="email"], input[type="email"]'
    ).first();
    const passwordInput = page.locator(
      'input[data-testid="password-input"], input[name="password"], input[type="password"]'
    ).first();
    const submitButton = page.locator(
      'button[data-testid="sign-in-button"], button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")'
    ).first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill('IncorrectPassword999!');
    await submitButton.click();

    // Verify error message is displayed
    const errorMessage = page.locator(
      '[data-testid="login-error-message"], [role="alert"], .text-rose-500, .error-message, text=/invalid|error|incorrect|wrong/i'
    ).first();

    await expect(errorMessage).toBeVisible();
  });

  test('5. Login fails with empty fields', async ({ page }) => {
    await page.goto('/account/login');
    if (!page.url().includes('/account')) {
      await page.goto('/account');
    }

    const submitButton = page.locator(
      'button[data-testid="sign-in-button"], button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")'
    ).first();

    await submitButton.click();

    // Verify HTML5 validation state or UI validation error
    const emailInput = page.locator(
      'input[data-testid="email-input"], input[name="email"], input[type="email"]'
    ).first();

    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity() || el.classList.contains('invalid'));
    const validationMessage = page.locator(
      '[role="alert"], .text-rose-500, text=/required|please fill/i'
    ).first();

    const hasValidationError = isInvalid || (await validationMessage.isVisible().catch(() => false));
    expect(hasValidationError).toBe(true);
  });

  test('6. User can logout', async ({ page }) => {
    // Perform login first
    await page.goto('/account/login');
    if (!page.url().includes('/account')) {
      await page.goto('/account');
    }

    const emailInput = page.locator(
      'input[data-testid="email-input"], input[name="email"], input[type="email"]'
    ).first();
    const passwordInput = page.locator(
      'input[data-testid="password-input"], input[name="password"], input[type="password"]'
    ).first();
    const submitButton = page.locator(
      'button[data-testid="sign-in-button"], button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")'
    ).first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await submitButton.click();

    await page.waitForURL(/\/account/, { timeout: 10000 });

    // Find and click the logout button
    const logoutButton = page.locator(
      '[data-testid="logout-button"], button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Log out")'
    ).first();

    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify user is redirected back to login page or home page
    await page.waitForURL(/(\/account\/login|\/$|\/store)/, { timeout: 10000 });
    const isLoggedOut = page.url().includes('/login') || page.url().endsWith('/') || page.url().includes('/store');
    expect(isLoggedOut).toBe(true);
  });
});
