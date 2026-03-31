import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Unauthorized from './pages/Unauthorized';
import Medicines from './pages/Medicines';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerOrders from './pages/CustomerOrders';
import CustomerMedicines from './pages/CustomerMedicines';
import CustomerBills from './pages/CustomerBills';
import CustomerBill from './pages/CustomerBill';
import StaffBilling from './pages/StaffBilling';
import StaffInvoice from './pages/StaffInvoice';
import BillSuccess from './pages/BillSuccess';
import AllInvoices from './pages/AllInvoices';
import AdminBilling from './pages/AdminBilling';
import AdminBills from './pages/AdminBills';
import AdminUsers from './pages/AdminUsers';
import InventoryLogs from './pages/InventoryLogs';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import ClinicalAnalytics from './pages/ClinicalAnalytics';
import Chatbot from './components/Chatbot';

function ChatbotVisibility() {
  const { user } = useAuth();
  if (user) return <Chatbot />;
  return null;
}

/** Redirect /dashboard to the correct role-specific dashboard */
function DashboardRedirect() {
  const role = localStorage.getItem('userRole');
  if (role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'Pharmacist') return <Navigate to="/pharmacist/dashboard" replace />;
  if (role === 'Staff') return <Navigate to="/staff/dashboard" replace />;
  if (role === 'Customer') return <Navigate to="/customer/dashboard" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Generic /dashboard → role-based redirect */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
            } />

            {/* Role-Specific Dashboards */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/dashboard" element={
              <ProtectedRoute allowedRoles={['Pharmacist']}>
                <PharmacistDashboard />
              </ProtectedRoute>
            } />
            <Route path="/staff/dashboard" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            } />

            {/* Shared Internal Pages */}
            <Route path="/medicines" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist', 'Staff']}>
                <Medicines />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist']}>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist']}>
                <Suppliers />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist', 'Staff']}>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist']}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Billing */}
            <Route path="/staff/billing" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffBilling />
              </ProtectedRoute>
            } />
            <Route path="/staff/bill-success" element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <BillSuccess />
              </ProtectedRoute>
            } />
            <Route path="/staff/invoice/:billId" element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin']}>
                <StaffInvoice />
              </ProtectedRoute>
            } />
            <Route path="/staff/invoices/:billId" element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin']}>
                <StaffInvoice />
              </ProtectedRoute>
            } />
            <Route path="/staff/invoices" element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin']}>
                <AllInvoices />
              </ProtectedRoute>
            } />
            <Route path="/admin/billing" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminBilling />
              </ProtectedRoute>
            } />
            <Route path="/admin/invoices" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AllInvoices />
              </ProtectedRoute>
            } />
            <Route path="/admin/invoices/:billId" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <StaffInvoice />
              </ProtectedRoute>
            } />
            <Route path="/admin/bills" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AllInvoices />
              </ProtectedRoute>
            } />

            {/* Admin Tools */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/inventory-logs" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist']}>
                <InventoryLogs />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/inventory-logs" element={
              <ProtectedRoute allowedRoles={['Admin', 'Pharmacist']}>
                <InventoryLogs />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ClinicalAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/analytics" element={
              <ProtectedRoute allowedRoles={['Pharmacist']}>
                <ClinicalAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/predictive-analytics" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <PredictiveAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/predictive-analytics" element={
              <ProtectedRoute allowedRoles={['Pharmacist']}>
                <PredictiveAnalytics />
              </ProtectedRoute>
            } />

            {/* Customer Portal */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer/dashboard" element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/orders" element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerOrders />
              </ProtectedRoute>
            } />
            <Route path="/customer/medicines" element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerMedicines />
              </ProtectedRoute>
            } />
            <Route path="/customer/bills" element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerBills />
              </ProtectedRoute>
            } />
            <Route path="/customer/bill/:billId" element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerBill />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatbotVisibility />
        </SidebarProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
