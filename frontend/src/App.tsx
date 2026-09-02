import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';

import { MainLayout } from './components/layout/MainLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Core Public Pages (Immediate)
import { HomePage } from './pages/public/HomePage';
import { ProductsPage } from './pages/public/ProductsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';

// Lazy Loaded Public Pages
const FarmersPage = lazy(() => import('./pages/public/FarmersPage').then(m => ({ default: m.FarmersPage })));
const FarmerDetailPage = lazy(() => import('./pages/public/FarmerDetailPage').then(m => ({ default: m.FarmerDetailPage })));
const FarmMapPage = lazy(() => import('./pages/public/FarmMapPage').then(m => ({ default: m.FarmMapPage })));
const MarketRadarPage = lazy(() => import('./pages/public/MarketRadarPage').then(m => ({ default: m.MarketRadarPage })));
const SeasonalCalendarPage = lazy(() => import('./pages/public/SeasonalCalendarPage').then(m => ({ default: m.SeasonalCalendarPage })));
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then(m => ({ default: m.AboutPage })));

// Auth Pages (Lazy)
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));

// Customer Shopping & Portal Pages (Lazy)
const CartPage = lazy(() => import('./pages/customer/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const CustomerOrdersPage = lazy(() => import('./pages/customer/CustomerOrdersPage').then(m => ({ default: m.CustomerOrdersPage })));
const CustomerOrderDetailPage = lazy(() => import('./pages/customer/CustomerOrderDetailPage').then(m => ({ default: m.CustomerOrderDetailPage })));
const CustomerAddressesPage = lazy(() => import('./pages/customer/CustomerAddressesPage').then(m => ({ default: m.CustomerAddressesPage })));
const CustomerWishlistPage = lazy(() => import('./pages/customer/CustomerWishlistPage').then(m => ({ default: m.CustomerWishlistPage })));
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage').then(m => ({ default: m.CustomerProfilePage })));
const CustomerMessagesPage = lazy(() => import('./pages/customer/CustomerMessagesPage').then(m => ({ default: m.CustomerMessagesPage })));
const CustomerSubscriptionsPage = lazy(() => import('./pages/customer/CustomerSubscriptionsPage').then(m => ({ default: m.CustomerSubscriptionsPage })));

// Farmer Portal Pages (Lazy)
const FarmerDashboardPage = lazy(() => import('./pages/farmer/FarmerDashboardPage').then(m => ({ default: m.FarmerDashboardPage })));
const FarmerAgriIntelligencePage = lazy(() => import('./pages/farmer/FarmerAgriIntelligencePage').then(m => ({ default: m.FarmerAgriIntelligencePage })));
const FarmerProductsPage = lazy(() => import('./pages/farmer/FarmerProductsPage').then(m => ({ default: m.FarmerProductsPage })));
const FarmerProductFormPage = lazy(() => import('./pages/farmer/FarmerProductFormPage').then(m => ({ default: m.FarmerProductFormPage })));
const FarmerInventoryPage = lazy(() => import('./pages/farmer/FarmerInventoryPage').then(m => ({ default: m.FarmerInventoryPage })));
const FarmerOrdersPage = lazy(() => import('./pages/farmer/FarmerOrdersPage').then(m => ({ default: m.FarmerOrdersPage })));
const FarmerCustomersPage = lazy(() => import('./pages/farmer/FarmerCustomersPage').then(m => ({ default: m.FarmerCustomersPage })));
const FarmerProfilePage = lazy(() => import('./pages/farmer/FarmerProfilePage').then(m => ({ default: m.FarmerProfilePage })));

// Admin Console Pages (Lazy)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminFarmersPage = lazy(() => import('./pages/admin/AdminFarmersPage').then(m => ({ default: m.AdminFarmersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));

// Lightweight Route Loading Skeleton
const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-forest-600 border-t-transparent animate-spin" />
    <span className="text-xs font-semibold text-stone-500">Loading FarmerDirect...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <LanguageProvider>
            <ToastProvider>
              <BrowserRouter>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                  {/* Public & Customer Shopping Flow */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:slug" element={<ProductDetailPage />} />
                    <Route path="/farmers" element={<FarmersPage />} />
                    <Route path="/farmers/:slug" element={<FarmerDetailPage />} />
                    <Route path="/map" element={<FarmMapPage />} />
                    <Route path="/radar" element={<MarketRadarPage />} />
                    <Route path="/calendar" element={<SeasonalCalendarPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/about" element={<AboutPage />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    <Route path="/customer/cart" element={<CartPage />} />
                    <Route path="/customer/checkout" element={<CheckoutPage />} />
                  </Route>

                  {/* Customer & Account Dashboard Portal */}
                  <Route path="/customer" element={<DashboardLayout portal="customer" />}>
                    <Route path="orders" element={<CustomerOrdersPage />} />
                    <Route path="orders/:id" element={<CustomerOrderDetailPage />} />
                    <Route path="subscriptions" element={<CustomerSubscriptionsPage />} />
                    <Route path="messages" element={<CustomerMessagesPage />} />
                    <Route path="addresses" element={<CustomerAddressesPage />} />
                    <Route path="wishlist" element={<CustomerWishlistPage />} />
                    <Route path="profile" element={<CustomerProfilePage />} />
                  </Route>

                  {/* Farmer Dashboard Portal */}
                  <Route path="/farmer" element={<DashboardLayout portal="farmer" requiredRole="FARMER" />}>
                    <Route path="dashboard" element={<FarmerDashboardPage />} />
                    <Route path="agri-ai" element={<FarmerAgriIntelligencePage />} />
                    <Route path="products" element={<FarmerProductsPage />} />
                    <Route path="products/new" element={<FarmerProductFormPage />} />
                    <Route path="products/:id/edit" element={<FarmerProductFormPage />} />
                    <Route path="inventory" element={<FarmerInventoryPage />} />
                    <Route path="orders" element={<FarmerOrdersPage />} />
                    <Route path="orders/:id" element={<FarmerOrdersPage />} />
                    <Route path="customers" element={<FarmerCustomersPage />} />
                    <Route path="profile" element={<FarmerProfilePage />} />
                  </Route>

                  {/* Admin Console Portal */}
                  <Route path="/admin" element={<DashboardLayout portal="admin" requiredRole="ADMIN" />}>
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="farmers" element={<AdminFarmersPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="reviews" element={<AdminReviewsPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            </ToastProvider>
          </LanguageProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
