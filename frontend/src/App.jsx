import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AccountLayout from './components/account/AccountLayout';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Blog from './pages/Blog';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CustomerLogin from './pages/CustomerLogin';
import CustomerSignup from './pages/CustomerSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/account/Profile';
import CustomerOrders from './pages/account/Orders';
import OrderDetail from './pages/account/OrderDetail';
import Wishlist from './pages/account/Wishlist';
import Addresses from './pages/account/Addresses';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import BulkOperations from './pages/admin/BulkOperations';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminAnalytics from './pages/admin/Analytics';
import AdminDiscounts from './pages/admin/Discounts';
import AdminPricingRules from './pages/admin/PricingRules';
import AdminAbandonedCarts from './pages/admin/AbandonedCarts';
import AdminCustomers from './pages/admin/Customers';
import AdminSettings from './pages/admin/Settings';
import DeliveryZones from './pages/admin/DeliveryZones';
import Returns from './pages/admin/Returns';
import MetalRates from './pages/admin/MetalRates';
import Blogs from './pages/admin/marketing/Blogs';
import BlogForm from './pages/admin/marketing/BlogForm';
import EmailCampaigns from './pages/admin/marketing/EmailCampaigns';
import EmailCampaignForm from './pages/admin/marketing/EmailCampaignForm';
import PushNotifications from './pages/admin/marketing/PushNotifications';
import Subscribers from './pages/admin/marketing/Subscribers';
import Automation from './pages/admin/marketing/Automation';
import EmailTemplates from './pages/admin/marketing/EmailTemplates';
import MarketingAnalytics from './pages/admin/marketing/MarketingAnalytics';
import './App.css';

// Remove unused Blog import since we now use BlogList
// import Blog from './pages/Blog';

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
          path="/product/:id"
          element={
            <MainLayout>
              <ProductDetail />
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
        <Route
          path="/cart"
          element={
            <MainLayout>
              <Cart />
            </MainLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <MainLayout>
              <Checkout />
            </MainLayout>
          }
        />
        <Route
          path="/orders/:orderId/confirmation"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrderConfirmation />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <MainLayout>
              <About />
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <MainLayout>
              <Contact />
            </MainLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <MainLayout>
              <Privacy />
            </MainLayout>
          }
        />
        <Route
          path="/blog"
          element={
            <MainLayout>
              <BlogList />
            </MainLayout>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <MainLayout>
              <BlogDetail />
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
          <Route path="orders/:orderId" element={<OrderDetail />} />
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
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="products/bulk" element={<BulkOperations />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="discounts" element={<AdminDiscounts />} />
          <Route path="pricing-rules" element={<AdminPricingRules />} />
          <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="delivery-zones" element={<DeliveryZones />} />
          <Route path="returns" element={<Returns />} />
          <Route path="metal-rates" element={<MetalRates />} />
          <Route path="marketing/analytics" element={<MarketingAnalytics />} />
          <Route path="marketing/blogs" element={<Blogs />} />
          <Route path="marketing/blogs/new" element={<BlogForm />} />
          <Route path="marketing/blogs/edit/:id" element={<BlogForm />} />
          <Route path="marketing/email-campaigns" element={<EmailCampaigns />} />
          <Route path="marketing/email-campaigns/new" element={<EmailCampaignForm />} />
          <Route path="marketing/email-campaigns/edit/:id" element={<EmailCampaignForm />} />
          <Route path="marketing/push-notifications" element={<PushNotifications />} />
          <Route path="marketing/subscribers" element={<Subscribers />} />
          <Route path="marketing/templates" element={<EmailTemplates />} />
          <Route path="marketing/automation" element={<Automation />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
