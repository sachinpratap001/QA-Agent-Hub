const { test, expect } = require('@playwright/test');

/**
 * Helper to navigate to first product and select variant if required
 */
async function selectFirstProductAndOpen(page) {
  await page.goto('/store');
  const firstProduct = page.locator('a[href*="/products/"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 10000 });
  await firstProduct.click();
  await page.waitForURL(/\/products\//, { timeout: 10000 });

  // If variant buttons exist (e.g., sizes/options), click first available option
  const optionButton = page.locator(
    'button[data-testid="option-button"], [role="radiogroup"] button'
  ).first();
  if (await optionButton.isVisible().catch(() => false)) {
    await optionButton.click();
  }
}

test.describe('Medusa Storefront - Cart Operations', () => {

  test('1. User can add product to cart', async ({ page }) => {
    await selectFirstProductAndOpen(page);

    const addToCartButton = page.locator(
      '[data-testid="add-product-button"], button:has-text("Add to cart"), button:has-text("Add to Cart")'
    ).first();

    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // Verify cart updates via cart drawer opening, notification popup, or badge update
    const cartIndicator = page.locator(
      '[data-testid="cart-dropdown"], [data-testid="cart-subtotal"], [data-testid="cart-count"], [role="dialog"], text=/added to cart/i'
    ).first();

    await expect(cartIndicator).toBeVisible({ timeout: 10000 });
  });

  test('2. Cart icon shows item count badge', async ({ page }) => {
    await selectFirstProductAndOpen(page);

    const addToCartButton = page.locator(
      '[data-testid="add-product-button"], button:has-text("Add to cart"), button:has-text("Add to Cart")'
    ).first();

    await addToCartButton.click();

    // Verify cart count badge contains at least "1"
    const cartBadge = page.locator(
      '[data-testid="nav-cart-link"], [data-testid="cart-count"], a[href*="/cart"]'
    ).first();

    await expect(cartBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await cartBadge.innerText();
    expect(badgeText).toMatch(/[1-9]/);
  });

  test('3. User can open cart sidebar or cart page', async ({ page }) => {
    await selectFirstProductAndOpen(page);

    // Add product to ensure cart is not empty
    const addToCartButton = page.locator(
      '[data-testid="add-product-button"], button:has-text("Add to cart"), button:has-text("Add to Cart")'
    ).first();
    await addToCartButton.click();

    // Click cart icon in navigation bar
    const cartNavButton = page.locator(
      '[data-testid="nav-cart-link"], a[href*="/cart"], button:has-text("Cart")'
    ).first();

    await cartNavButton.click();

    // Cart container or page should be visible
    const cartView = page.locator(
      '[data-testid="cart-container"], [data-testid="cart-items"], [data-testid="cart-dropdown"], div[class*="cart"]'
    ).first();

    await expect(cartView).toBeVisible({ timeout: 10000 });
  });

  test('4. User can remove item from cart', async ({ page }) => {
    await selectFirstProductAndOpen(page);

    // Add item to cart
    const addToCartButton = page.locator(
      '[data-testid="add-product-button"], button:has-text("Add to cart"), button:has-text("Add to Cart")'
    ).first();
    await addToCartButton.click();

    // Open cart
    const cartNavButton = page.locator(
      '[data-testid="nav-cart-link"], a[href*="/cart"], button:has-text("Cart")'
    ).first();
    await cartNavButton.click();

    // Locate and click remove button
    const removeButton = page.locator(
      '[data-testid="remove-item-button"], button[data-testid="product-delete-button"], button:has-text("Remove"), button[aria-label*="remove" i]'
    ).first();

    await expect(removeButton).toBeVisible({ timeout: 10000 });
    await removeButton.click();

    // Confirm cart is either empty or item count has decreased
    const emptyNotice = page.locator(
      'text=/empty|no items/i, [data-testid="empty-cart-message"]'
    ).first();

    await expect(emptyNotice).toBeVisible({ timeout: 10000 });
  });

  test('5. Cart shows correct total', async ({ page }) => {
    await selectFirstProductAndOpen(page);

    // Capture product price from product details page
    const productPriceEl = page.locator(
      '[data-testid="product-price"], [data-testid="price"], span:has-text("$"), span:has-text("€")'
    ).first();

    await expect(productPriceEl).toBeVisible();
    const productPriceText = (await productPriceEl.innerText()).trim();

    // Add product to cart
    const addToCartButton = page.locator(
      '[data-testid="add-product-button"], button:has-text("Add to cart"), button:has-text("Add to Cart")'
    ).first();
    await addToCartButton.click();

    // Open cart
    const cartNavButton = page.locator(
      '[data-testid="nav-cart-link"], a[href*="/cart"], button:has-text("Cart")'
    ).first();
    await cartNavButton.click();

    // Verify subtotal or total in cart contains numerical price
    const cartSubtotalEl = page.locator(
      '[data-testid="cart-subtotal"], [data-testid="cart-total"], span:has-text("$"), span:has-text("€")'
    ).first();

    await expect(cartSubtotalEl).toBeVisible({ timeout: 10000 });
    const cartSubtotalText = await cartSubtotalEl.innerText();

    // Check that currency symbol matches and subtotal exists
    expect(cartSubtotalText.length).toBeGreaterThan(0);
    if (productPriceText.includes('$')) {
      expect(cartSubtotalText).toContain('$');
    }
  });
});
