import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AccountLayout from './components/account/AccountLayout';
import Home from './pages/Home';
import Products from './pages/Products';
import CustomerLogin from './pages/CustomerLogin';
import CustomerSignup from './pages/CustomerSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/account/Profile';
import CustomerOrders from './pages/account/Orders';
import Wishlist from './pages/account/Wishlist';
import Addresses from './pages/account/Addresses';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminAnalytics from './pages/admin/Analytics';
import AdminDiscounts from './pages/admin/Discounts';
import AdminAbandonedCarts from './pages/admin/AbandonedCarts';
import AdminCustomers from './pages/admin/Customers';
import AdminSettings from './pages/admin/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />
        <Route
          path="/products"
          element={
            <MainLayout>
              <Products />
            </MainLayout>
          }
        />
        <Route
          path="/products/:category"
          element={
            <MainLayout>
              <Products />
            </MainLayout>
          }
        />

        {/* Customer Auth Routes */}
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/signup" element={<CustomerSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Account Routes */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AccountLayout />
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="addresses" element={<Addresses />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="discounts" element={<AdminDiscounts />} />
          <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
