const Auth = {
  tokenKey: 'mg_token',
  userKey: 'mg_user',

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.userKey) || 'null');
    } catch (_err) {
      return null;
    }
  },

  setSession(data) {
    if (data.token) localStorage.setItem(this.tokenKey, data.token);
    if (data.user) localStorage.setItem(this.userKey, JSON.stringify(data.user));
  },

  clear() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  },

  requireAuth() {
    if (!this.getToken()) {
      location.href = 'login.html';
      return false;
    }
    return true;
  },

  logout() {
    this.clear();
    location.href = 'login.html';
  }
};

window.Auth = Auth;
