import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '../common/Button';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Close drawer on ESC key & prevent body scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, closeCart]);

  const FREE_SHIPPING_THRESHOLD = 30.0;
  const subtotal = cart?.subtotal ? parseFloat(cart.subtotal) : 0;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleCheckout = () => {
    closeCart();
    navigate('/customer/checkout');
  };

  const handleViewFullCart = () => {
    closeCart();
    navigate('/customer/cart');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-900 font-display">Your Harvest Cart</h2>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {cart?.total_items || 0} {cart?.total_items === 1 ? 'item' : 'items'} ready for delivery
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Progress Tracker */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50 via-forest-50 to-teal-50 border-b border-emerald-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                  <div className="flex items-center gap-1.5 text-forest-900">
                    <Truck className="w-3.5 h-3.5 text-forest-600" />
                    <span>
                      {amountRemaining === 0 ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> You unlocked Free Farm Delivery!
                        </span>
                      ) : (
                        <>
                          Add <strong className="text-forest-700">${amountRemaining.toFixed(2)}</strong> more for Free Delivery
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      progressPercent >= 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-forest-500 to-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-stone-100">
                {!cart || cart.items.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-800">Your harvest basket is empty</h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                        Explore organic produce directly from independent Cambodian farmers.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        closeCart();
                        navigate('/products');
                      }}
                      className="rounded-xl font-bold"
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  cart.items.map((item) => {
                    const itemQty = parseFloat(item.quantity);
                    return (
                      <div key={item.id} className="py-4 first:pt-1 last:pb-1 flex gap-3.5 items-center">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200/80 relative">
                          {item.product.primary_image ? (
                            <img
                              src={item.product.primary_image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xl">🌱</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.product.slug}`}
                            onClick={closeCart}
                            className="text-xs font-bold text-stone-900 hover:text-forest-700 truncate block transition-colors leading-snug"
                          >
                            {item.product.name}
                          </Link>

                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                            <span>${parseFloat(item.product.price).toFixed(2)} / {item.product.unit}</span>
                            {item.product.is_organic && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Organic
                              </span>
                            )}
                          </div>

                          {/* Stepper Controls */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50/80 p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  if (itemQty <= 1) {
                                    removeFromCart(item.id);
                                  } else {
                                    updateQuantity(item.id, itemQty - 1);
                                  }
                                }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-stone-600 hover:bg-white hover:text-stone-900 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-stone-800 font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, itemQty + 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-stone-600 hover:bg-white hover:text-stone-900 transition-colors"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-stone-900 font-display">
                                ${parseFloat(item.subtotal).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-stone-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                                title="Remove item"
                                aria-label={`Remove ${item.product.name} from cart`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sticky Footer: Totals, CTA, Security Trust Badges */}
              {cart && cart.items.length > 0 && (
                <div className="p-5 border-t border-stone-200 bg-stone-50/90 space-y-3 shrink-0">
                  {/* Summary Rows */}
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Produce Subtotal</span>
                      <span className="font-bold text-stone-900">${cart.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <span>Farm Delivery Fee</span>
                        <span className="text-[10px] text-stone-400">({cart.farmer_groups.length} farm{cart.farmer_groups.length > 1 ? 's' : ''})</span>
                      </span>
                      <span className="font-bold text-stone-900">
                        {amountRemaining === 0 ? (
                          <span className="text-emerald-700 font-bold">FREE</span>
                        ) : (
                          `$${cart.delivery_fee}`
                        )}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-stone-900">Estimated Total</span>
                      <span className="text-xl font-black text-forest-700 font-display">
                        ${cart.total}
                      </span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <div className="space-y-2 pt-1">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleCheckout}
                      className="w-full py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-forest-600/20 hover:shadow-forest-600/30 flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <button
                      type="button"
                      onClick={handleViewFullCart}
                      className="w-full text-center text-xs font-bold text-stone-500 hover:text-stone-800 py-1 transition-colors"
                    >
                      View Full Cart Page
                    </button>
                  </div>

                  {/* Security Trust Badges */}
                  <div className="pt-2 border-t border-stone-200/80 flex items-center justify-around text-[10px] font-semibold text-stone-500">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-forest-600" />
                      256-Bit SSL
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-forest-600" />
                      Fresh Guarantee
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-forest-600" />
                      Direct Dispatch
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
