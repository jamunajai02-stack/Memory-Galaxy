const MemoryAPI = {
  async request(path, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    const token = window.Auth ? Auth.getToken() : localStorage.getItem('mg_token');
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`/api${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      const onAuthPage = /login|register|forgot|reset/.test(location.pathname);
      if (!onAuthPage) {
        localStorage.removeItem('mg_token');
        localStorage.removeItem('mg_user');
        location.href = 'login.html';
      }
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  register(body) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },
  login(body) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  forgotPassword(body) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) });
  },
  resetPassword(body) {
    return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) });
  },
  recoveryQuestion(body) {
    return this.request('/auth/recovery-question', { method: 'POST', body: JSON.stringify(body) });
  },
  resetWithRecovery(body) {
    return this.request('/auth/reset-with-recovery', { method: 'POST', body: JSON.stringify(body) });
  },
  listMemories() {
    return this.request('/memories');
  },
  getMemory(id) {
    return this.request(`/memories/${id}`);
  },
  createMemory(formData) {
    return this.request('/memories', { method: 'POST', body: formData });
  },
  updateMemory(id, formData) {
    return this.request(`/memories/${id}`, { method: 'PUT', body: formData });
  },
  deleteMemory(id) {
    return this.request(`/memories/${id}`, { method: 'DELETE' });
  },
  deleteImage(memoryId, imageId) {
    return this.request(`/memories/${memoryId}/images/${imageId}`, { method: 'DELETE' });
  },
  profile() {
    return this.request('/user/profile');
  },
  updateProfile(body) {
    return this.request('/user/profile', { method: 'PUT', body: JSON.stringify(body) });
  },
  changePassword(body) {
    return this.request('/user/change-password', { method: 'PUT', body: JSON.stringify(body) });
  },
  uploadAvatar(file) {
    const form = new FormData();
    form.append('avatar', file);
    return this.request('/user/avatar', { method: 'POST', body: form });
  },
  async mediaUrl(filename) {
    const token = window.Auth ? Auth.getToken() : localStorage.getItem('mg_token');
    const res = await fetch(`/api/media/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return '';
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
};

window.MemoryAPI = MemoryAPI;
