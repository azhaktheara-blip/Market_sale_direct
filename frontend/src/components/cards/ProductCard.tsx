import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Heart, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { Badge } from '../common/Badge';
import { StarRating } from '../common/StarRating';
import { OptimizedImage } from '../common/OptimizedImage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { favoritesApi } from '../../api';

interface ProductCardProps {
  product: Product;
  priority?: 'high' | 'low' | 'auto';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = 'auto' }) => {
  const { cart, addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const existingInCart = cart?.items?.find((it) => it.product?.id === product.id);
  const hasReviews = product.rating_count > 0 && parseFloat(product.rating_avg) > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsAdding(true);
      setErrorMsg(null);
      await addToCart(product.id, product.minimum_order_qty || '1.00');
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const res = await favoritesApi.toggleFavorite({ product_id: product.id });
      setIsFav(res.data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative bg-white rounded-3xl border border-stone-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300/80 transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Product Image Banner */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <OptimizedImage
          thumbnailSrc={product.thumbnail_url}
          mediumSrc={product.medium_image_url}
          src={product.primary_image}
          blurPlaceholder={product.blur_placeholder}
          productName={product.name}
          category={product.category_name || (typeof product.category === 'object' ? product.category?.name : undefined)}
          alt={product.name}
          priority={priority}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          containerClassName="w-full h-full"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-10">
          {product.status === 'OUT_OF_STOCK' ? (
            <Badge variant="danger" size="sm">
              {t('card.out_of_stock')}
            </Badge>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] sm:text-[10px] font-bold shadow-xs backdrop-blur-xs">
              In Stock
            </span>
          )}
          {product.is_organic && (
            <Badge variant="organic" size="sm">
              {t('card.organic')}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        {isAuthenticated && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-stone-400 hover:text-rose-500 hover:bg-white transition-colors z-10"
            title="Save to favorites"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        )}

        {/* Desktop "Quick Add" Overlay */}
        {product.status !== 'OUT_OF_STOCK' && (
          <div className="hidden md:flex absolute inset-x-3 bottom-3 z-20 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={isAdding}
              className="pointer-events-auto w-full py-2.5 px-3 rounded-2xl bg-forest-900/95 hover:bg-forest-800 text-white text-xs font-black shadow-lg shadow-stone-900/20 backdrop-blur-md flex items-center justify-center gap-1.5 transition-colors border border-forest-700/50"
            >
              {isAdding ? (
                <span className="text-[11px] animate-pulse">Adding...</span>
              ) : isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                  <span className="text-emerald-300">Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
        <div>
          {/* Farmer & Location Attribution */}
          <div className="flex items-center justify-between gap-1.5 mb-1 text-[11px] sm:text-xs">
            <Link
              to={`/farmers/${product.farmer.slug}`}
              className="font-semibold text-stone-600 hover:text-forest-800 truncate inline-flex items-center gap-1 group/farmer"
            >
              <span className="truncate">{product.farmer.farm_name}</span>
              {product.farmer.is_verified && (
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 shrink-0" />
              )}
            </Link>
            <span className="text-stone-400 shrink-0 text-[10px] sm:text-[11px] flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {product.farmer.province}
            </span>
          </div>

          {/* Bold Product Title */}
          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 group-hover:text-forest-700 transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Star-Rating Row Above Price */}
          <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-2">
            {hasReviews ? (
              <StarRating rating={product.rating_avg} count={product.rating_count} size="sm" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] sm:text-[10px] font-bold border border-emerald-200/80">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> {t('card.new_harvest')}
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] text-stone-400 font-medium">
              {product.harvest_date ? `${t('card.harvest_date')} ${product.harvest_date}` : ''}
            </span>
          </div>
        </div>

        {/* Footer: Price & Add to Cart */}
        <div className="pt-2.5 sm:pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-base sm:text-xl font-black text-stone-900 font-display">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 font-semibold lowercase truncate">/ {product.unit}</span>
            </div>
            {parseFloat(product.minimum_order_qty) > 1 && (
              <span className="text-[9px] sm:text-[10px] text-stone-400 block font-medium truncate">
                {t('card.min')} {product.minimum_order_qty} {product.unit}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleAddToCart}
            disabled={isAdding || product.status === 'OUT_OF_STOCK'}
            className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all duration-200 ${
              errorMsg
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                : existingInCart
                ? 'bg-forest-100 hover:bg-forest-600 text-forest-800 hover:text-white border border-forest-300'
                : 'bg-forest-50 hover:bg-forest-600 text-forest-800 hover:text-white border border-forest-200 shadow-2xs'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {errorMsg ? (
              <span className="text-[9px] sm:text-[10px] truncate max-w-[70px] sm:max-w-[100px]">{errorMsg}</span>
            ) : isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden xs:inline sm:inline">Added!</span>
              </>
            ) : existingInCart ? (
              <>
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline sm:inline">{t('card.in_cart')}</span>
                <span className="font-mono">({existingInCart.quantity})</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t('card.add')}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
