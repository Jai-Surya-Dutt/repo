// Frontend Authentication Module
const API_BASE_URL = 'http://localhost:5000/api';

class Auth {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.token;
  }

  // Get current user
  async getUser() {
    if (!this.token) {
      return null;
    }

    if (this.user) {
      return this.user;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.data.user;
        return this.user;
      } else {
        // Token is invalid, clear it
        this.logout();
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      this.logout();
      return null;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.data.token;
        this.user = data.data.user;
        localStorage.setItem('authToken', this.token);
        return this.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.data.token;
        this.user = data.data.user;
        localStorage.setItem('authToken', this.token);
        return this.user;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken');
    }
  }

  // Get authorization header for API requests
  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }

  // Make authenticated API request
  async authenticatedRequest(url, options = {}) {
    if (!this.token) {
      throw new Error('User not authenticated');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    };

    // Only set Content-Type if not already set (for file uploads)
    if (!options.headers || !options.headers['Content-Type']) {
      defaultOptions.headers['Content-Type'] = 'application/json';
    }

    return fetch(url, { ...options, ...defaultOptions });
  }
}

// Create global auth instance
const auth = new Auth();

// Export for use in other scripts
window.auth = auth;
