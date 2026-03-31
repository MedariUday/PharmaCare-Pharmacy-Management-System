import axios from 'axios';

// Use VITE_API_URL if provided, else fallback to '/api' for local dev proxy
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 unauthorised
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isCustomer = localStorage.getItem('userRole') === 'Customer';
      localStorage.clear();
      window.location.href = isCustomer ? '/customer/login' : '/';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const loginUser = (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  return api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
};

export const registerUser = (data) => api.post('/auth/register', data);

// ─── Medicines ───────────────────────────────────────────────
export const getMedicines = (params) => api.get('/medicines/', { params });
export const getMedicine = (id) => api.get(`/medicines/${id}`);
export const createMedicine = (data) => api.post('/medicines/', data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/medicines/${id}`);

// ─── Alerts ──────────────────────────────────────────────────
export const getExpiryAlerts = () => api.get('/alerts/expiry');
export const getLowStockAlerts = () => api.get('/alerts/low-stock');
export const getAlertsSummary = () => api.get('/alerts/summary');

// ─── Suppliers ───────────────────────────────────────────────
export const getSuppliers = () => api.get('/suppliers/');
export const createSupplier = (data) => api.post('/suppliers/', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// ─── Customers ───────────────────────────────────────────────
export const getCustomers = () => api.get('/customers/');
export const createCustomer = (data) => api.post('/customers/', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// ─── Sales ───────────────────────────────────────────────────
export const getSales = () => api.get('/bills/');
export const createSale = (data) => api.post('/sales/', data);

// ─── Inventory ───────────────────────────────────────────────
export const getInventoryLogs = (params) => api.get('/inventory/', { params });
export const addInventoryLog = (data) => api.post('/inventory/', data);
export const updateInventoryStock = (id, data) => api.put(`/inventory/update-stock/${id}`, data);

// ─── Reports ────────────────────────────────────────────────
export const getDailyReport = () => api.get('/reports/daily-sales');
export const getMonthlyReport = () => api.get('/reports/monthly-revenue');
export const getTopMedicines = () => api.get('/reports/top-medicines');
export const getAdminReportSummary = () => api.get('/reports/summary');

// ─── Bills ──────────────────────────────────────────────────
export const downloadBillPDF = (billId) => api.get(`/bills/${billId}/pdf`, { responseType: 'blob' });

// ─── Customer Portal ──────────────────────────────────────────
export const loginCustomer = (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  return api.post('/customer/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
};
export const registerCustomer = (data) => api.post('/customer/register', data);
export const getCustomerOrders = () => api.get('/customer/orders');
export const getCustomerBills = () => api.get('/customer/bills');
export const getCustomerMedicines = () => api.get('/customer/medicines');
export const getRecommendations = () => api.get('/customer/recommendations/');
export const sendChatQuery = (message) => api.post('/chatbot/query/', { message });

// ─── Cart (Staff) ─────────────────────────────────────────────
export const createCart = (data) => api.post('/cart/create', data);
export const getCart = (customerId) => api.get(`/cart/${customerId}`);
export const addMedicineToCart = (customerId, medData) => api.post(`/cart/add-medicine?customer_id=${customerId}`, medData);
export const updateCartQuantity = (customerId, medId, quantity) => api.put(`/cart/update-quantity?customer_id=${customerId}&medicine_id=${medId}&quantity=${quantity}`);
export const removeMedicineFromCart = (customerId, medId) => api.delete(`/cart/remove-medicine?customer_id=${customerId}&medicine_id=${medId}`);

// ─── Admin Billing ───────────────────────────────────────────
export const getAdminCart = (customerId) => api.get(`/admin/cart/${customerId}`);
export const generateAdminBill = (data) => api.post('/admin/generate-bill', data);
export const getAdminBill = (billId) => api.get(`/admin/bill/${billId}`);

// ─── Staff Billing (Direct Bill Generation) ──────────────────
export const generateStaffBill = (data) => api.post('/staff/generate-bill', data);

// ─── All Bills (Admin) ───────────────────────────────────────
export const getAllBills = (params) => api.get('/bills/', { params });

// ─── Pharmacist Portal ───────────────────────────────────────
export const updateMedicineStock = (id, stockChange, reason) => 
  api.put(`/pharmacist/update-stock/${id}`, null, { 
    params: { stock_change: stockChange, reason } 
  });

// ─── Analytics & Statistics ──────────────────────────────────
export const getCustomerStats = (id) => api.get(`/customers/${id}/stats`);
export const getFrequentMedicines = () => api.get('/medicines/frequent');
export const getBillDetails = (id) => api.get(`/bills/${id}`);

// ─── Admin User Management ────────────────────────────────────
export const adminCreateUser = (data) => api.post('/admin/users/', data);
export const adminGetUsers = () => api.get('/admin/users/');
export const adminUpdateUser = (id, data) => api.patch(`/admin/users/${id}`, data);
export const adminResetPassword = (id) => api.post(`/admin/users/${id}/reset-password`);
export const adminGeneratePassword = () => api.get('/admin/users/generate-password');

// ─── Staff Dashboard Summary ─────────────────────────────────
export const getStaffDashboardSummary = () => api.get('/staff/dashboard-summary');

// ─── Predictive Analytics ────────────────────────────────────
export const getInventoryPredictions = () => api.get('/inventory/predictions');
export const getClinicalAnalytics = () => api.get('/reports/clinical-analytics');

export { api };
export default api;
