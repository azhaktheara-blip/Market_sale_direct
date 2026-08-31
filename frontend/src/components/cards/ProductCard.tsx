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
          alt={product.name}
          priority={priority}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          containerClassName="w-full h-full"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_organic && (
            <Badge variant="organic" size="sm">
              {t('card.organic')}
            </Badge>
          )}
          {product.status === 'OUT_OF_STOCK' && (
            <Badge variant="danger" size="sm">
              {t('card.out_of_stock')}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        {isAuthenticated && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-stone-400 hover:text-rose-500 hover:bg-white transition-colors z-10"
            title="Save to favorites"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Farmer & Location Attribution */}
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
            <Link
              to={`/farmers/${product.farmer.slug}`}
              className="font-semibold text-stone-600 hover:text-forest-800 truncate inline-flex items-center gap-1 group/farmer"
            >
              <span className="truncate">{product.farmer.farm_name}</span>
              {product.farmer.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              )}
            </Link>
            <span className="text-stone-400 shrink-0 text-[11px] flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {product.farmer.province}
            </span>
          </div>

          {/* Bold Product Title */}
          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="text-base font-extrabold text-stone-900 group-hover:text-forest-700 transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating or New Harvest Badge */}
          <div className="mt-2 flex items-center justify-between gap-2">
            {hasReviews ? (
              <StarRating rating={product.rating_avg} count={product.rating_count} size="sm" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/80">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> {t('card.new_harvest')}
              </span>
            )}
            <span className="text-[10px] text-stone-400 font-medium">
              {t('card.harvest_date')} {product.harvest_date}
            </span>
          </div>
        </div>

        {/* Footer: Price & Add to Cart */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-stone-900 font-display">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              <span className="text-xs text-stone-500 font-semibold lowercase">/ {product.unit}</span>
            </div>
            {parseFloat(product.minimum_order_qty) > 1 && (
              <span className="text-[10px] text-stone-400 block font-medium">
                {t('card.min')} {product.minimum_order_qty} {product.unit}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isAdding || product.status === 'OUT_OF_STOCK'}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors duration-200 ${
              errorMsg
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-xs'
                : existingInCart
                ? 'bg-forest-100 hover:bg-forest-600 text-forest-800 hover:text-white border border-forest-300'
                : 'bg-forest-50 hover:bg-forest-600 text-forest-800 hover:text-white border border-forest-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {errorMsg ? (
              <span className="text-[10px] truncate max-w-[100px]">{errorMsg}</span>
            ) : isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('card.added')}</span>
              </>
            ) : existingInCart ? (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{t('card.in_cart')} ({existingInCart.quantity})</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{t('card.add')}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
