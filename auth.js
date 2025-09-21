// auth.js - Frontend Authentication Module
const API_BASE_URL = 'http://localhost:5000/api/';

class Auth {
  constructor() {
    this.token = localStorage.getItem('authToken') || null;
    this.user = null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return Boolean(this.token);
  }

  // Get current user from backend if not cached
  async getUser() {
    if (!this.token) return null;
    if (this.user) return this.user;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('[Auth] getUser response:', data);
      if (!response.ok) {
        await this.logout(); // Token invalid or expired
        return null;
      }
      // Support both `data.data.user` and `data.user` structures
      this.user = data.data?.user || data.user || null;
      return this.user;
    } catch (error) {
      console.error('[Auth] getUser error:', error);
      await this.logout();
      return null;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      console.log('[Auth] login response:', data);
      if (!response.ok) throw new Error(data.message || 'Login failed');
      this.token = data.data?.token || data.token || null;
      this.user = data.data?.user || data.user || null;
      if (this.token) localStorage.setItem('authToken', this.token);
      return this.user;
    } catch (error) {
      console.error('[Auth] login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      console.log('[Auth] register response:', data);

      if (!response.ok) throw new Error(data.message || 'Registration failed');

      this.token = data.data?.token || data.token || null;
      this.user = data.data?.user || data.user || null;
      if (this.token) localStorage.setItem('authToken', this.token);

      return this.user;

    } catch (error) {
      console.error('[Auth] register error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('[Auth] logout error:', error);
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken');
    }
  }

  // Get authorization header for API requests
  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  // Make authenticated API request
  async authenticatedRequest(url, options = {}) {
    if (!this.token) throw new Error('User not authenticated');

    const headers = {
      ...this.getAuthHeader(),
      ...options.headers
    };

    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({})); // fallback if not JSON
      if (!response.ok) {
        console.error('[Auth] Request error:', data);
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (error) {
      console.error('[Auth] authenticatedRequest error:', error);
      throw error;
    }
  }
}

// Create global auth instance
const auth = new Auth();
window.auth = auth;
