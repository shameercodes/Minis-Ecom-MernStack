import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import AdminRoute from './components/layout/AdminRoute';
import PrivateRoute from './components/layout/PrivateRoute';
import ScrollToTop from './components/ui/ScrollToTop';

// Store pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import WomenPage from './pages/WomenPage';
import MenPage from './pages/MenPage';
import KidsPage from './pages/KidsPage';
import AccessoriesPage from './pages/AccessoriesPage';
import SalePage from './pages/SalePage';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ContactPage from './pages/ContactPage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';
import Offers from "./pages/Offers";
import SharedWishlistPage from "./pages/SharedWishlistPage";

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminShipments from './pages/admin/AdminShipments';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCoupons from "./pages/admin/AdminCoupons";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Store Routes ── */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="offers" element={<Offers />} />

          {/* Category landing pages (with dropdown subcategories) */}
          <Route path="shop/women" element={<WomenPage />} />
          <Route path="shop/men" element={<MenPage />} />
          <Route path="shop/kids" element={<KidsPage />} />
          <Route path="shop/accessories" element={<AccessoriesPage />} />

          {/* General shop */}
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:category" element={<ShopPage />} />

          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="sale" element={<SalePage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="shared-wishlist/:token" element={<SharedWishlistPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Admin Routes ── */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="shipments" element={<AdminShipments />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
