const {
  api,
  createTestCart,
  TEST_REGION_ID,
} = require('./setup');

describe('Medusa Store API - Cart Endpoints', () => {
  let cartId = null;
  let validVariantId = null;
  let addedLineItemId = null;

  beforeAll(async () => {
    // 1. Obtain a valid product variant ID from the store catalog
    try {
      const prodRes = await api.get('/store/products');
      if (prodRes.status === 200 && prodRes.data.products?.length > 0) {
        for (const prod of prodRes.data.products) {
          if (prod.variants && prod.variants.length > 0) {
            validVariantId = prod.variants[0].id;
            break;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch products for variant ID:', err.message);
    }

    // 2. Create a test cart to be used across cart tests
    cartId = await createTestCart(TEST_REGION_ID);
    if (!cartId) {
      // Fallback create without region_id if default region is used
      cartId = await createTestCart(null);
    }
  });

  // Test 1: Create a new cart
  it('1. POST /store/carts - creates cart successfully returning 200/201, id, and empty items array', async () => {
    const response = await api.post('/store/carts', {});

    expect([200, 201]).toContain(response.status);
    expect(response.data).toHaveProperty('cart');
    expect(response.data.cart).toHaveProperty('id');
    expect(typeof response.data.cart.id).toBe('string');
    expect(Array.isArray(response.data.cart.items)).toBe(true);
  });

  // Test 2: Create cart with invalid region_id
  it('2. POST /store/carts - with invalid region_id returns 400 or 422 or 404', async () => {
    const response = await api.post('/store/carts', {
      region_id: 'reg_invalid_nonexistent_99999',
    });

    expect([400, 404, 422]).toContain(response.status);
  });

  // Test 3: Get cart by ID
  it('3. GET /store/carts/:id - returns valid cart matching the requested id', async () => {
    expect(cartId).toBeDefined();

    const response = await api.get(`/store/carts/${cartId}`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('cart');
    expect(response.data.cart.id).toBe(cartId);
  });

  // Test 4: Get cart with non-existent ID
  it('4. GET /store/carts/:id - with non-existent id returns 404', async () => {
    const nonExistentCartId = 'cart_nonexistent_0123456789';
    const response = await api.get(`/store/carts/${nonExistentCartId}`);

    expect(response.status).toBe(404);
  });

  // Test 5: Add line item with valid variant_id and quantity
  it('5. POST /store/carts/:id/line-items - add item with valid variant_id and quantity returns 200', async () => {
    if (!validVariantId || !cartId) {
      console.warn('Skipping test 5: cartId or validVariantId missing');
      return;
    }

    const response = await api.post(`/store/carts/${cartId}/line-items`, {
      variant_id: validVariantId,
      quantity: 1,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('cart');
    expect(response.data.cart.items.length).toBeGreaterThan(0);

    const addedItem = response.data.cart.items.find(
      (item) => item.variant_id === validVariantId
    );
    expect(addedItem).toBeDefined();
    expect(addedItem.quantity).toBeGreaterThanOrEqual(1);

    // Save lineItemId for removal test
    addedLineItemId = addedItem.id;
  });

  // Test 6: Add line item with invalid quantity 0
  it('6. POST /store/carts/:id/line-items - add item with quantity 0 returns 400 or 422', async () => {
    if (!validVariantId || !cartId) return;

    const response = await api.post(`/store/carts/${cartId}/line-items`, {
      variant_id: validVariantId,
      quantity: 0,
    });

    expect([400, 422]).toContain(response.status);
  });

  // Test 7: Add line item with invalid variant_id
  it('7. POST /store/carts/:id/line-items - add item with invalid variant_id returns 400, 404, or 422', async () => {
    if (!cartId) return;

    const response = await api.post(`/store/carts/${cartId}/line-items`, {
      variant_id: 'variant_invalid_nonexistent_99999',
      quantity: 1,
    });

    expect([400, 404, 422]).toContain(response.status);
  });

  // Test 8: Remove line item from cart
  it('8. DELETE /store/carts/:id/line-items/:lineItemId - removes item returning 200 and item no longer in cart', async () => {
    if (!cartId) return;

    // Ensure we have a line item to remove
    let itemToRemoveId = addedLineItemId;
    if (!itemToRemoveId && validVariantId) {
      const addRes = await api.post(`/store/carts/${cartId}/line-items`, {
        variant_id: validVariantId,
        quantity: 1,
      });
      if (addRes.status === 200 && addRes.data.cart?.items?.length > 0) {
        itemToRemoveId = addRes.data.cart.items[0].id;
      }
    }

    if (!itemToRemoveId) {
      console.warn('Skipping test 8: No line item available to remove');
      return;
    }

    const response = await api.delete(`/store/carts/${cartId}/line-items/${itemToRemoveId}`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('cart');

    const remainingItems = response.data.cart.items || [];
    const found = remainingItems.find((item) => item.id === itemToRemoveId);
    expect(found).toBeUndefined();
  });
});
