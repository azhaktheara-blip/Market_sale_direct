import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { OptimizedImage } from '../../components/common/OptimizedImage';

export const CartPage: React.FC = () => {
  const { cart, isLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (isLoading && !cart) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8" />}
          title="Your shopping cart is empty"
          description="Browse produce directly from local farms and add fresh harvest to your cart."
          actionLabel="Shop Fresh Produce"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display">
            Shopping Cart
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {cart.total_items} items from {cart.farmer_groups.length} local farm(s).
          </p>
        </div>
        <button
          onClick={() => clearCart()}
          className="text-xs text-stone-400 hover:text-rose-600 font-semibold transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Farm Groupings */}
        <div className="lg:col-span-8 space-y-6">
          {cart.farmer_groups.map((group) => (
            <div
              key={group.farmer_id}
              className="bg-white rounded-3xl border border-stone-200/80 shadow-soft overflow-hidden"
            >
              <div className="bg-stone-50/80 px-6 py-3.5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">{group.farm_name}</span>
                  {group.is_verified && <ShieldCheck className="w-4 h-4 text-teal-600" />}
                  <span className="text-xs text-stone-400 font-light ml-1">({group.province})</span>
                </div>
                <span className="text-[11px] font-semibold text-forest-800 bg-forest-100/70 px-2 py-0.5 rounded-full">
                  ${group.delivery_fee} Farm Direct Delivery
                </span>
              </div>

              <div className="p-6 divide-y divide-stone-100">
                {group.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        <OptimizedImage
                          src={item.product.primary_image}
                          thumbnailSrc={item.product.thumbnail_url}
                          mediumSrc={item.product.medium_image_url}
                          productName={item.product.name}
                          category={typeof item.product.category === 'object' ? item.product.category?.name : undefined}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                          fallbackIconSize={20}
                        />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/products/${item.product.slug}`} className="font-bold text-stone-900 text-sm hover:text-forest-700 truncate block">
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          ${parseFloat(item.product.price).toFixed(2)} / {item.product.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(1, parseFloat(item.quantity) - 1))}
                          className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-stone-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, parseFloat(item.quantity) + 1)}
                          className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-extrabold text-stone-900 text-sm w-16 text-right">
                        ${parseFloat(item.subtotal).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-300 hover:text-rose-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Produce Subtotal</span>
                <span className="font-bold text-stone-900">${cart.subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <span>Farm Delivery Fee</span>
                  <span className="text-stone-400 font-normal">({cart.farmer_groups.length} farm × $2.00)</span>
                </span>
                <span className="font-bold text-stone-900">${cart.delivery_fee}</span>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-stone-900">
                <span className="text-sm font-bold">Total</span>
                <span className="text-2xl font-extrabold text-forest-700">${cart.total}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link to="/customer/checkout" className="block w-full">
                <Button variant="primary" size="lg" className="w-full rounded-2xl font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Proceed to Checkout
                </Button>
              </Link>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 text-center flex items-center justify-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-forest-600" />
                <span>Orders are dispatched directly from harvest</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

