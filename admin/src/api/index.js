import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  analytics: (period) => api.get(`/dashboard/analytics?period=${period}`),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  assignAgent: (id, data) => api.put(`/orders/${id}/assign-agent`, data),
  stats: () => api.get('/orders/stats'),
};

export const foodAPI = {
  getAll: (params) => api.get('/food', { params }),
  getOne: (id) => api.get(`/food/${id}`),
  create: (data) => api.post('/food', data),
  update: (id, data) => api.put(`/food/${id}`, data),
  delete: (id) => api.delete(`/food/${id}`),
  toggle: (id) => api.patch(`/food/${id}/toggle`),
  getCategories: () => api.get('/food/categories'),
  createCategory: (data) => api.post('/food/categories', data),
  updateCategory: (id, data) => api.put(`/food/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/food/categories/${id}`),
};

export const restaurantsAPI = {
  getAll: (params) => api.get('/restaurants', { params }),
  getOne: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  updateStatus: (id, data) => api.patch(`/restaurants/${id}/status`, data),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  toggleBlock: (id) => api.patch(`/users/${id}/toggle-block`),
  getOrders: (id, params) => api.get(`/users/${id}/orders`, { params }),
};

export const adminsAPI = {
  getAll: () => api.get('/admins'),
  create: (data) => api.post('/admins', data),
  update: (id, data) => api.put(`/admins/${id}`, data),
  delete: (id) => api.delete(`/admins/${id}`),
  toggle: (id) => api.patch(`/admins/${id}/toggle`),
};

export const couponsAPI = {
  getAll: (params) => api.get('/coupons', { params }),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  toggle: (id) => api.patch(`/coupons/${id}/toggle`),
};

export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  updateStatus: (id, data) => api.put(`/reviews/${id}/status`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const deliveryAPI = {
  getAll: (params) => api.get('/delivery', { params }),
  create: (data) => api.post('/delivery', data),
  update: (id, data) => api.put(`/delivery/${id}`, data),
  delete: (id) => api.delete(`/delivery/${id}`),
  getDeliveries: (id) => api.get(`/delivery/${id}/deliveries`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
  update: (id, data) => api.put(`/notifications/${id}`, data),
  send: (id) => api.post(`/notifications/${id}/send`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
