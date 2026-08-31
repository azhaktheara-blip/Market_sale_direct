import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  ShoppingCart,
  Search,
  User as UserIcon,
  Menu,
  X,
  Bell,
  LogOut,
  LayoutDashboard,
  Package,
  Heart,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Button } from '../common/Button';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      {/* Top Notification / Trust Bar */}
      <div className="bg-forest-900 text-forest-100 text-[11px] font-medium py-1.5 px-4 text-center">
        <span>{t('nav.top_trust')}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-forest-600 flex items-center justify-center text-white shadow-sm group-hover:bg-forest-700 transition-colors">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-stone-900 leading-none tracking-tight font-display">
                Farmer<span className="text-forest-600">Direct</span>
              </span>
              <span className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase mt-0.5">
                {t('nav.brand_sub')}
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('nav.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100/80 hover:bg-stone-100 focus:bg-white border border-stone-200 focus:border-forest-600 rounded-full pl-10 pr-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-100 transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-600">
            <Link to="/products" className="hover:text-forest-700 transition-colors">
              {t('nav.fresh_produce')}
            </Link>
            <Link to="/farmers" className="hover:text-forest-700 transition-colors">
              {t('nav.local_farmers')}
            </Link>
            <Link to="/map" className="hover:text-forest-700 transition-colors flex items-center gap-1">
              <span>{t('nav.farm_map')}</span>
            </Link>
            <Link to="/radar" className="hover:text-forest-700 transition-colors flex items-center gap-1">
              <span>{t('nav.market_radar')}</span>
            </Link>
            <Link to="/calendar" className="hover:text-forest-700 transition-colors flex items-center gap-1">
              <span>{t('nav.crop_calendar')}</span>
            </Link>
            <Link to="/how-it-works" className="hover:text-forest-700 transition-colors">
              {t('nav.how_it_works')}
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Wishlist */}
            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <Link
                to="/customer/wishlist"
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors hidden sm:flex"
                title="Saved favorites"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* Cart Button */}
            <Link
              to="/customer/cart"
              className="relative p-2 text-stone-700 hover:text-forest-700 hover:bg-forest-50 rounded-full transition-colors group"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1.3, 1], opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 bg-forest-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </motion.span>
              )}
            </Link>

            {/* Auth / Profile Area */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-stone-100 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 font-bold flex items-center justify-center text-xs border border-forest-200">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.username?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-20">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-semibold text-stone-900 truncate">{user.username}</p>
                        <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase">
                          {user.role}
                        </span>
                      </div>

                      {user.role === 'FARMER' && (
                        <Link
                          to="/farmer/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-forest-50 hover:text-forest-700"
                        >
                          <LayoutDashboard className="w-4 h-4 text-forest-600" />
                          {t('nav.farmer_dashboard')}
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-forest-50 hover:text-forest-700"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          {t('nav.admin_console')}
                        </Link>
                      )}

                      <Link
                        to="/customer/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-forest-50 hover:text-forest-700"
                      >
                        <Package className="w-4 h-4 text-stone-400" />
                        {t('nav.my_orders')}
                      </Link>

                      <Link
                        to="/customer/subscriptions"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-forest-50 hover:text-forest-700"
                      >
                        <Sprout className="w-4 h-4 text-forest-600" />
                        {t('nav.harvest_subscriptions')}
                      </Link>

                      <Link
                        to="/customer/messages"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-forest-50 hover:text-forest-700"
                      >
                        <Bell className="w-4 h-4 text-stone-400" />
                        {t('nav.inquiries_chat')}
                      </Link>

                      <Link
                        to="/customer/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-forest-50 hover:text-forest-700"
                      >
                        <UserIcon className="w-4 h-4 text-stone-400" />
                        {t('nav.profile_settings')}
                      </Link>

                      <div className="border-t border-stone-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav.sign_out')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.sign_in')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    {t('nav.join_free')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-stone-500">Language / ភាសា</span>
              <LanguageSwitcher />
            </div>

            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('nav.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-sm"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            <div className="flex flex-col gap-2 font-medium text-sm text-stone-700">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-forest-50 hover:text-forest-700"
              >
                {t('nav.fresh_produce')}
              </Link>
              <Link
                to="/farmers"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-forest-50 hover:text-forest-700"
              >
                {t('nav.local_farmers')}
              </Link>
              <Link
                to="/radar"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-forest-50 hover:text-forest-700"
              >
                {t('nav.market_radar')}
              </Link>
              <Link
                to="/map"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-forest-50 hover:text-forest-700"
              >
                {t('nav.farm_map')}
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-forest-50 hover:text-forest-700"
              >
                {t('nav.how_it_works')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

