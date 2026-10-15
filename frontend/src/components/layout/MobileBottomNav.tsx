import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, MapPin, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { cart, openCart } = useCart();
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
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-2 py-1 flex items-center justify-around safe-bottom"
    >
      <NavLink
        to="/"
        aria-label="Home"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`
        }
      >
        <Home className="w-5 h-5 mb-0.5 stroke-[2.2]" />
        <span className="text-[10px] tracking-tight">Home</span>
      </NavLink>

      <NavLink
        to="/products"
        aria-label="Explore produce"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`
        }
      >
        <Compass className="w-5 h-5 mb-0.5 stroke-[2.2]" />
        <span className="text-[10px] tracking-tight">Explore</span>
      </NavLink>

      <NavLink
        to="/map"
        aria-label="Farm Map"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`
        }
      >
        <MapPin className="w-5 h-5 mb-0.5 stroke-[2.2]" />
        <span className="text-[10px] tracking-tight">Farm Map</span>
      </NavLink>

      <button
        type="button"
        onClick={openCart}
        aria-label={`Shopping cart, ${totalItems} items`}
        className="flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl transition-all duration-150 relative text-stone-500 hover:text-stone-800 active:scale-95"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-forest-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">Cart</span>
      </button>

      <NavLink
        to={profileLink}
        aria-label="Account and orders"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
            isActive ? 'text-forest-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`
        }
      >
        <User className="w-5 h-5 mb-0.5 stroke-[2.2]" />
        <span className="text-[10px] tracking-tight">
          {isAuthenticated ? (user?.role === 'FARMER' ? 'Farm Hub' : 'Orders') : 'Account'}
        </span>
      </NavLink>
    </nav>
  );
};

