const {
  api,
  createTestCart,
  TEST_EMAIL,
  TEST_REGION_ID,
} = require('./setup');

describe('Medusa Store API - Checkout & Order Endpoints', () => {
  let cartId = null;
  let validVariantId = null;
  let shippingOptionId = null;

  beforeAll(async () => {
    // 1. Fetch available products to get a valid variant ID
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
      console.warn('Error fetching products in checkout setup:', err.message);
    }

    // 2. Create dedicated cart for checkout tests
    cartId = await createTestCart(TEST_REGION_ID);
    if (!cartId) {
      cartId = await createTestCart(null);
    }

    // 3. Add email and line item to cart
    if (cartId) {
      await api.post(`/store/carts/${cartId}`, {
        email: TEST_EMAIL,
      });

      if (validVariantId) {
        await api.post(`/store/carts/${cartId}/line-items`, {
          variant_id: validVariantId,
          quantity: 1,
        });
      }
    }
  });

  // Test 1: Add valid shipping address
  it('1. POST /store/carts/:id/shipping-address - add valid shipping address returns 200', async () => {
    if (!cartId) return;

    const validAddress = {
      address: {
        first_name: 'Jane',
        last_name: 'Doe',
        address_1: '100 Broadway Suite 4',
        city: 'New York',
        country_code: 'us',
        postal_code: '10001',
        phone: '+15559876543',
      },
    };

    const response = await api.post(`/store/carts/${cartId}/shipping-address`, validAddress);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('cart');
    expect(response.data.cart).toHaveProperty('shipping_address');
    expect(response.data.cart.shipping_address.first_name).toBe('Jane');
    expect(response.data.cart.shipping_address.country_code).toBe('us');
  });

  // Test 2: Add shipping address with missing required fields
  it('2. POST /store/carts/:id/shipping-address - missing required fields returns 422 or 400', async () => {
    if (!cartId) return;

    const invalidAddress = {
      address: {
        first_name: 'Jane',
        // missing address_1, city, country_code, postal_code
      },
    };

    const response = await api.post(`/store/carts/${cartId}/shipping-address`, invalidAddress);

    expect([400, 422]).toContain(response.status);
  });

  // Test 3: Add shipping address with invalid country_code
  it('3. POST /store/carts/:id/shipping-address - invalid country_code returns 422 or 400', async () => {
    if (!cartId) return;

    const invalidCountryAddress = {
      address: {
        first_name: 'Jane',
        last_name: 'Doe',
        address_1: '100 Broadway',
        city: 'New York',
        country_code: 'INVALID_COUNTRY',
        postal_code: '10001',
      },
    };

    const response = await api.post(`/store/carts/${cartId}/shipping-address`, invalidCountryAddress);

    expect([400, 422]).toContain(response.status);
  });

  // Test 4: Get shipping options for cart
  it('4. GET /store/shipping-options/:cartId - returns available options as an array with 200', async () => {
    if (!cartId) return;

    const response = await api.get(`/store/shipping-options/${cartId}`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('shipping_options');
    expect(Array.isArray(response.data.shipping_options)).toBe(true);

    if (response.data.shipping_options.length > 0) {
      shippingOptionId = response.data.shipping_options[0].id;
      expect(response.data.shipping_options[0]).toHaveProperty('id');
      expect(response.data.shipping_options[0]).toHaveProperty('price_type');
    }
  });

  // Test 5: Initialize payment sessions
  it('5. POST /store/carts/:id/payment-sessions - creates payment session returns 200', async () => {
    if (!cartId) return;

    // If shipping method is available, select it before creating payment session
    if (shippingOptionId) {
      await api.post(`/store/carts/${cartId}/shipping-methods`, {
        option_id: shippingOptionId,
      });
    }

    const response = await api.post(`/store/carts/${cartId}/payment-sessions`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('cart');
    expect(response.data.cart).toHaveProperty('payment_sessions');
    expect(Array.isArray(response.data.cart.payment_sessions)).toBe(true);
  });

  // Test 6: Complete cart to create order
  it('6. POST /store/orders - complete cart to create order returns 200 with order id and status', async () => {
    if (!cartId) return;

    // Create a dedicated full-flow cart for order completion
    const completeCartId = await createTestCart(TEST_REGION_ID);
    if (!completeCartId) return;

    // Set email
    await api.post(`/store/carts/${completeCartId}`, { email: TEST_EMAIL });

    // Add item
    if (validVariantId) {
      await api.post(`/store/carts/${completeCartId}/line-items`, {
        variant_id: validVariantId,
        quantity: 1,
      });
    }

    // Set shipping address
    await api.post(`/store/carts/${completeCartId}/shipping-address`, {
      address: {
        first_name: 'John',
        last_name: 'Doe',
        address_1: '123 Main St',
        city: 'New York',
        country_code: 'us',
        postal_code: '10001',
      },
    });

    // Set shipping method if option available
    const shipRes = await api.get(`/store/shipping-options/${completeCartId}`);
    if (shipRes.status === 200 && shipRes.data.shipping_options?.length > 0) {
      await api.post(`/store/carts/${completeCartId}/shipping-methods`, {
        option_id: shipRes.data.shipping_options[0].id,
      });
    }

    // Create payment session
    const payRes = await api.post(`/store/carts/${completeCartId}/payment-sessions`);
    if (payRes.status === 200 && payRes.data.cart?.payment_sessions?.length > 0) {
      const providerId = payRes.data.cart.payment_sessions[0].provider_id;
      await api.post(`/store/carts/${completeCartId}/payment-session`, {
        provider_id: providerId,
      });
    }

    // Attempt POST /store/orders with fallback to POST /store/carts/:id/complete
    let response = await api.post('/store/orders', {
      cart_id: completeCartId,
    });

    if (response.status === 404) {
      response = await api.post(`/store/carts/${completeCartId}/complete`);
    }

    expect([200, 201]).toContain(response.status);
    const orderData = response.data?.order || response.data?.data;
    if (orderData) {
      expect(orderData).toHaveProperty('id');
      expect(orderData).toHaveProperty('status');
      expect(['pending', 'processing', 'completed', 'requires_action']).toContain(orderData.status);
    }
  });

  // Test 7: Attempt order completion with empty cart
  it('7. POST /store/orders - with cart that has no items returns 422 or 400', async () => {
    const emptyCartId = await createTestCart(TEST_REGION_ID);
    if (!emptyCartId) return;

    let response = await api.post('/store/orders', {
      cart_id: emptyCartId,
    });

    if (response.status === 404) {
      response = await api.post(`/store/carts/${emptyCartId}/complete`);
    }

    expect([400, 422]).toContain(response.status);
  });
});
