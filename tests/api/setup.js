const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const BASE_URL = process.env.MEDUSA_API_URL || 'http://localhost:9000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test.qa@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!';
const TEST_REGION_ID = process.env.TEST_REGION_ID || 'reg_01';

/**
 * Pre-configured axios instance that does not throw on HTTP error status codes.
 */
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Authenticates with Medusa store API and returns session cookie or auth token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string|null>}
 */
async function getAuthToken(email = TEST_EMAIL, password = TEST_PASSWORD) {
  try {
    const response = await api.post('/store/auth', {
      email,
      password,
    });

    if (response.status === 200) {
      // 1. Check for token in response body
      if (response.data && (response.data.token || response.data.access_token)) {
        return response.data.token || response.data.access_token;
      }

      // 2. Check for session cookie in headers
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
        return cookieStr;
      }

      // Fallback placeholder token if server returned 200 without explicit token
      return 'medusa_session_authenticated';
    }

    return null;
  } catch (error) {
    console.error('getAuthToken error:', error.message);
    return null;
  }
}

/**
 * Creates a new shopping cart in Medusa and returns the cart ID.
 * @param {string} [regionId]
 * @returns {Promise<string|null>}
 */
async function createTestCart(regionId = TEST_REGION_ID) {
  try {
    const payload = regionId ? { region_id: regionId } : {};
    const response = await api.post('/store/carts', payload);

    if (response.status === 200 || response.status === 201) {
      const cartId = response.data?.cart?.id || response.data?.id;
      return cartId || null;
    }

    return null;
  } catch (error) {
    console.error('createTestCart error:', error.message);
    return null;
  }
}

module.exports = {
  BASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_REGION_ID,
  api,
  getAuthToken,
  createTestCart,
};
