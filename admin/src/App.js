import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import { LoadingCenter } from './components/ui/Loaders';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Orders from './pages/orders/Orders';
import OrderDetail from './pages/orders/OrderDetail';
import Food from './pages/food/Food';
import Restaurants from './pages/restaurants/Restaurants';
import Users from './pages/users/Users';
import Delivery from './pages/delivery/Delivery';
import Coupons from './pages/coupons/Coupons';
import Reviews from './pages/reviews/Reviews';
import Admins from './pages/admins/Admins';
import Notifications from './pages/notifications/Notifications';
import Settings from './pages/settings/Settings';

const ProtectedRoute = ({ children, perm }) => {
  const { admin, loading, hasPermission } = useAuth();
  if (loading) return <LoadingCenter />;
  if (!admin) return <Navigate to="/login" replace />;
  if (perm && !hasPermission(perm)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <LoadingCenter />;
  if (admin) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProtectedRoute perm="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute perm="orders"><Orders /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute perm="orders"><OrderDetail /></ProtectedRoute>} />
        <Route path="food" element={<ProtectedRoute perm="food"><Food /></ProtectedRoute>} />
        <Route path="restaurants" element={<ProtectedRoute perm="restaurants"><Restaurants /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute perm="users"><Users /></ProtectedRoute>} />
        <Route path="delivery" element={<ProtectedRoute perm="delivery"><Delivery /></ProtectedRoute>} />
        <Route path="coupons" element={<ProtectedRoute perm="coupons"><Coupons /></ProtectedRoute>} />
        <Route path="reviews" element={<ProtectedRoute perm="reviews"><Reviews /></ProtectedRoute>} />
        <Route path="admins" element={<ProtectedRoute perm="admins"><Admins /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute perm="notifications"><Notifications /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute perm="settings"><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13 },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
