const axios = require('axios');
const {
  BASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
  api,
  getAuthToken,
} = require('./setup');

describe('Medusa Store API - Authentication & Customer Endpoints', () => {
  let authCookieOrToken = null;
  let authHeaders = {};

  beforeAll(async () => {
    // Ensure the default test customer exists in the test database
    try {
      await api.post('/store/customers', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        first_name: 'QA',
        last_name: 'Tester',
      });
    } catch (err) {
      // Ignored if user already exists
    }

    // Authenticate and retrieve token/session for authenticated tests
    authCookieOrToken = await getAuthToken(TEST_EMAIL, TEST_PASSWORD);
    if (authCookieOrToken) {
      authHeaders = {
        Cookie: authCookieOrToken,
        Authorization: `Bearer ${authCookieOrToken}`,
      };
    }
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  // Test 1: Successful login
  it('1. POST /store/auth - successful login with valid credentials returns 200 and customer object', async () => {
    const response = await api.post('/store/auth', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('customer');
    expect(response.data.customer.email).toBe(TEST_EMAIL.toLowerCase());
  });

  // Test 2: Login with invalid password
  it('2. POST /store/auth - login with invalid password returns 401', async () => {
    const response = await api.post('/store/auth', {
      email: TEST_EMAIL,
      password: 'IncorrectPassword999!',
    });

    expect(response.status).toBe(401);
  });

  // Test 3: Login with non-existent email
  it('3. POST /store/auth - login with non-existent email returns 401', async () => {
    const randomEmail = `nonexistent_${Date.now()}@example.com`;
    const response = await api.post('/store/auth', {
      email: randomEmail,
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(401);
  });

  // Test 4: Login with empty body
  it('4. POST /store/auth - login with empty body returns 400 or 422', async () => {
    const response = await api.post('/store/auth', {});

    expect([400, 422]).toContain(response.status);
  });

  // Test 5: Login with missing password field
  it('5. POST /store/auth - login with missing password field returns 400 or 422', async () => {
    const response = await api.post('/store/auth', {
      email: TEST_EMAIL,
    });

    expect([400, 422]).toContain(response.status);
  });

  // Test 6: Login with invalid email format
  it('6. POST /store/auth - login with invalid email format returns 400 or 401', async () => {
    const response = await api.post('/store/auth', {
      email: 'not-a-valid-email-format',
      password: TEST_PASSWORD,
    });

    expect([400, 401, 422]).toContain(response.status);
  });

  // Test 7: Get current customer when authenticated
  it('7. GET /store/auth - get current customer when authenticated returns 200 and customer email', async () => {
    // If authHeaders not set in beforeAll, obtain a fresh session
    let headers = authHeaders;
    if (!headers.Cookie && !headers.Authorization) {
      const loginRes = await api.post('/store/auth', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      const cookie = loginRes.headers['set-cookie'];
      headers = {
        Cookie: Array.isArray(cookie) ? cookie.join('; ') : cookie,
      };
    }

    const response = await api.get('/store/auth', { headers });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('customer');
    expect(response.data.customer).toHaveProperty('email');
    expect(response.data.customer.email).toBe(TEST_EMAIL.toLowerCase());
  });

  // Test 8: Get current customer when not authenticated
  it('8. GET /store/auth - get current customer when not authenticated returns 401', async () => {
    const response = await api.get('/store/auth');

    expect(response.status).toBe(401);
  });

  // Test 9: Logout when authenticated
  it('9. DELETE /store/auth - logout when authenticated returns 200', async () => {
    // Log in specifically for this test to isolate logout
    const loginRes = await api.post('/store/auth', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const setCookie = loginRes.headers['set-cookie'];
    const sessionCookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;

    const response = await api.delete('/store/auth', {
      headers: {
        Cookie: sessionCookie,
      },
    });

    expect([200, 204]).toContain(response.status);
  });

  // Test 10: Register new customer with valid data
  it('10. POST /store/customers - register with valid data returns 201 or 200 and customer object', async () => {
    const uniqueEmail = `qa.customer.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`;
    const response = await api.post('/store/customers', {
      email: uniqueEmail,
      password: 'SecurePass123!',
      first_name: 'Alice',
      last_name: 'QA',
      phone: '+15551234567',
    });

    expect([200, 201]).toContain(response.status);
    expect(response.data).toHaveProperty('customer');
    expect(response.data.customer.email).toBe(uniqueEmail.toLowerCase());
    expect(response.data.customer.first_name).toBe('Alice');
  });
});
