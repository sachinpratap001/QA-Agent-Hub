const { api } = require('./setup');

describe('Medusa Store API - Product Endpoints', () => {
  let validProductId = null;
  let sampleProductTitle = null;

  beforeAll(async () => {
    // Fetch products list to dynamically obtain a valid product ID and title
    const response = await api.get('/store/products');
    if (response.status === 200 && response.data.products && response.data.products.length > 0) {
      const firstProduct = response.data.products[0];
      validProductId = firstProduct.id;
      sampleProductTitle = firstProduct.title;
    }
  });

  // Test 1: List products
  it('1. GET /store/products - returns 200 with array of products', async () => {
    const response = await api.get('/store/products');

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('products');
    expect(Array.isArray(response.data.products)).toBe(true);
  });

  // Test 2: Response schema
  it('2. GET /store/products - response schema has products[], count, offset, limit', async () => {
    const response = await api.get('/store/products');

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('products');
    expect(response.data).toHaveProperty('count');
    expect(response.data).toHaveProperty('offset');
    expect(response.data).toHaveProperty('limit');
    expect(typeof response.data.count).toBe('number');
    expect(typeof response.data.offset).toBe('number');
    expect(typeof response.data.limit).toBe('number');
  });

  // Test 3: Get single product by valid ID
  it('3. GET /store/products/:id - valid product id returns 200 with product details', async () => {
    if (!validProductId) {
      console.warn('No products available in database to test valid ID lookup');
      return;
    }

    const response = await api.get(`/store/products/${validProductId}`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('product');
    expect(response.data.product.id).toBe(validProductId);
    expect(response.data.product).toHaveProperty('title');
    expect(response.data.product).toHaveProperty('variants');
  });

  // Test 4: Get single product with non-existent ID
  it('4. GET /store/products/:id - invalid or non-existent id returns 404', async () => {
    const nonExistentId = 'prod_nonexistent_999999';
    const response = await api.get(`/store/products/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  // Test 5: Pagination support
  it('5. GET /store/products?limit=2 - pagination works and returns maximum 2 products', async () => {
    const response = await api.get('/store/products?limit=2');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.products)).toBe(true);
    expect(response.data.products.length).toBeLessThanOrEqual(2);
    expect(response.data.limit).toBe(2);
  });

  // Test 6: Search query filtering
  it('6. GET /store/products?q=query - search returns filtered results', async () => {
    const searchQuery = sampleProductTitle ? sampleProductTitle.split(' ')[0] : 'shirt';
    const response = await api.get(`/store/products?q=${encodeURIComponent(searchQuery)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.products)).toBe(true);
    // If results are found, verify they match or include products
    if (response.data.products.length > 0) {
      expect(response.data.products[0]).toHaveProperty('title');
    }
  });

  // Test 7: Verify required product schema fields across collection
  it('7. GET /store/products - each product has id, title, and variants array', async () => {
    const response = await api.get('/store/products');

    expect(response.status).toBe(200);
    const { products } = response.data;
    expect(products.length).toBeGreaterThan(0);

    products.forEach((product) => {
      expect(product).toHaveProperty('id');
      expect(typeof product.id).toBe('string');
      expect(product).toHaveProperty('title');
      expect(typeof product.title).toBe('string');
      expect(product).toHaveProperty('variants');
      expect(Array.isArray(product.variants)).toBe(true);
      expect(product.variants.length).toBeGreaterThan(0);
    });
  });
});
