import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, MapPin, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { cart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const totalItems = cart?.total_items || 0;

  const profileLink = !isAuthenticated
    ? '/login'
    : user?.role === 'FARMER'
    ? '/farmer/dashboard'
    : user?.role === 'ADMIN'
    ? '/admin/dashboard'
    : '/customer/orders';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-lg px-2 py-1.5 flex items-center justify-around safe-bottom">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-900'
          }`
        }
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Home</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-900'
          }`
        }
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Explore</span>
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-900'
          }`
        }
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Farm Map</span>
      </NavLink>

      <NavLink
        to="/cart"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-900'
          }`
        }
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-forest-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </div>
        <span className="text-[10px]">Cart</span>
      </NavLink>

      <NavLink
        to={profileLink}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-900'
          }`
        }
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">
          {isAuthenticated ? (user?.role === 'FARMER' ? 'Farm Hub' : 'Orders') : 'Account'}
        </span>
      </NavLink>
    </div>
  );
};

