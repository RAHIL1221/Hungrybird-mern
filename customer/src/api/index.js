import axios from 'axios';

const api = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/customer', 
  withCredentials: true 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('customerRefreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/customer/auth/refresh-token', { refreshToken: refresh });
          localStorage.setItem('customerToken', data.token);
          localStorage.setItem('customerRefreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerRefreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
};

export const menuAPI = {
  getRestaurants: (params) => api.get('/menu/restaurants', { params }),
  getRestaurant: (id) => api.get(`/menu/restaurants/${id}`),
  getFeaturedRestaurants: () => api.get('/menu/restaurants/featured'),
  getCategories: () => api.get('/menu/categories'),
  getFeaturedFoods: () => api.get('/menu/foods/featured'),
  searchFoods: (params) => api.get('/menu/foods/search', { params }),
};

export const orderAPI = {
  placeOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders', { params }),
  getMyOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  validateCoupon: (data) => api.post('/orders/validate-coupon', data),
  submitReview: (data) => api.post('/orders/review', data),
};

export const settingsAPI = {
  getPublicSettings: () => axios.get('http://localhost:5000/api/settings/public'),
};

export default api;
