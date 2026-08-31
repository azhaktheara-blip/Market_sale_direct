import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Star,
  Settings,
  ShieldCheck,
  MapPin,
  Heart,
  BarChart3,
  FileCheck,
  MessageSquare,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  portal: 'customer' | 'farmer' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ portal }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const customerLinks = [
    { name: t('nav.my_orders'), to: '/customer/orders', icon: ShoppingBag },
    { name: t('nav.harvest_subscriptions'), to: '/customer/subscriptions', icon: Repeat },
    { name: t('nav.inquiries_chat'), to: '/customer/messages', icon: MessageSquare },
    { name: 'Delivery Addresses', to: '/customer/addresses', icon: MapPin },
    { name: 'Saved Favorites', to: '/customer/wishlist', icon: Heart },
    { name: t('nav.profile_settings'), to: '/customer/profile', icon: Settings },
  ];

  const farmerLinks = [
    { name: t('farmer.dashboard'), to: '/farmer/dashboard', icon: LayoutDashboard },
    { name: t('nav.agri_ai'), to: '/farmer/agri-ai', icon: Sparkles },
    { name: t('nav.manage_products'), to: '/farmer/products', icon: Package },
    { name: t('nav.live_inventory'), to: '/farmer/inventory', icon: Layers },
    { name: t('nav.incoming_orders'), to: '/farmer/orders', icon: ShoppingBag },
    { name: t('nav.inquiries_chat'), to: '/customer/messages', icon: MessageSquare },
    { name: t('nav.customer_directory'), to: '/farmer/customers', icon: Users },
    { name: t('nav.farm_profile'), to: '/farmer/profile', icon: ShieldCheck },
  ];

  const adminLinks = [
    { name: 'Platform Analytics', to: '/admin/dashboard', icon: BarChart3 },
    { name: 'Farmer Verification', to: '/admin/farmers', icon: FileCheck },
    { name: 'Product Catalog', to: '/admin/products', icon: Package },
    { name: 'Order Oversight', to: '/admin/orders', icon: ShoppingBag },
    { name: 'Review Moderation', to: '/admin/reviews', icon: Star },
  ];

  const links =
    portal === 'farmer' ? farmerLinks : portal === 'admin' ? adminLinks : customerLinks;

  return (
    <aside className="w-64 bg-white border-r border-stone-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col shrink-0">
      {/* User Mini Card */}
      <div className="p-3 mb-6 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forest-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-900 truncate">
            {portal === 'farmer' && user?.farmer_profile
              ? user.farmer_profile.farm_name
              : user?.username}
          </p>
          <span className="text-[10px] font-semibold text-forest-700 uppercase tracking-wider block">
            {portal.toUpperCase()} PORTAL
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5 flex-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/farmer/dashboard' || item.to === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-forest-50 text-forest-800 border border-forest-200/80 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Helper Box */}
      <div className="mt-auto p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800">
        <p className="font-bold mb-0.5">Need assistance?</p>
        <p className="text-emerald-700">Contact our farmer support hotline at +855 12 888 999.</p>
      </div>
    </aside>
  );
};

