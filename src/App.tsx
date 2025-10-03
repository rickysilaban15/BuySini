import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './hooks/cart-context';
import ScrollToTop from './components/ScrollToTop';

// Public Pages
import Index from './pages/Index';
import Category from './pages/category';
import Promo from './pages/promo';
import About from './pages/about';
import Contact from './pages/contact';
import NotFound from './pages/NotFound';
import Products from './pages/products';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderPending from './pages/OrderPending';
import CheckoutFailed from './pages/CheckoutFailed';
import TrackOrder from './pages/TrackOrder';
import OrderHistory from './pages/OrderHistory';
import PaymentReturn from './pages/PaymentReturn';
import Sitemap from './pages/Sitemap';
import Faq from './pages/Faq';
import Help from './pages/Help';
import Affiliate from './pages/Affiliate';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import ReturnPolicy from './pages/ReturnPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import ProductDetail from './pages/ProductDetail';
import PaymentShippingLogos from './pages/PaymentShippingLogos';
import Invoice from './pages/Invoice';
import PaymentCallback from './pages/PaymentCallback';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminBanners from './pages/admin/Banners';
import AdminSettings from './pages/admin/Settings';
import AdminOrderItems from './pages/admin/OrderItems';
import AdminPromos from './pages/admin/Promos';
import AdminPaymentMethods from './pages/admin/PaymentMethods';
import AdminShippingMethods from './pages/admin/ShippingMethods';

// Protected Route for Admin
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminData = localStorage.getItem('admin');

  if (!adminData) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const parsed = JSON.parse(adminData);
    if (parsed.role !== 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        {/* ScrollToTop harus di dalam BrowserRouter */}
        <ScrollToTop />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/category" element={<Category />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/order-pending" element={<OrderPending />} />
          <Route path="/checkout-failed" element={<CheckoutFailed />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/payment-return" element={<PaymentReturn />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/help" element={<Help />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/payment-shipping-logos" element={<PaymentShippingLogos />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/payment-callback" element={<PaymentCallback />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes with Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orderitems" element={<AdminOrderItems />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="promos" element={<AdminPromos />} />
            <Route path="payment-methods" element={<AdminPaymentMethods />} />
            <Route path="shipping-methods" element={<AdminShippingMethods />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
