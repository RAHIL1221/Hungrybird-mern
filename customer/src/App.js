import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import { LoadingCenter } from './components/ui/Loading';

import Home from './pages/home/Home';
import Restaurants from './pages/restaurants/Restaurants';
import RestaurantDetail from './pages/restaurants/RestaurantDetail';
import SearchResults from './pages/search/SearchResults';
import Cart from './pages/cart/Cart';
import Orders from './pages/orders/Orders';
import OrderDetail from './pages/orders/OrderDetail';
import Profile from './pages/profile/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingCenter />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingCenter />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/search" element={<><Navbar /><SearchResults /></>} />
      <Route path="/restaurants" element={<><Navbar /><Restaurants /></>} />
      <Route path="/restaurants/:id" element={<><Navbar /><RestaurantDetail /></>} />
      <Route path="/cart" element={<><Navbar /><Cart /></>} />
      
      <Route path="/orders" element={<ProtectedRoute><Navbar /><Orders /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><Navbar /><OrderDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Navbar /><Profile /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontSize: 14,
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
