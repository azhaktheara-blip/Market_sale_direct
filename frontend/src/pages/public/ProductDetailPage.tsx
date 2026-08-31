import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  ShoppingCart,
  Check,
  Truck,
  Heart,
  Award,
  ChevronRight,
  Info,
  Package,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { productsApi, reviewsApi, favoritesApi, aiApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { StarRating } from '../../components/common/StarRating';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { ProductCard } from '../../components/cards/ProductCard';
import { VolumeDiscountTable } from '../../components/products/VolumeDiscountTable';
import { ChatModal } from '../../components/messaging/ChatModal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { cart, addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFav, setIsFav] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Fetch Product by Slug
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProductBySlug(slug!).then((res) => res.data),
    enabled: !!slug,
  });

  // Fetch Verified Reviews for this product
  const { data: reviewsData } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: () => reviewsApi.getProductReviews(product!.id).then((res) => res.data),
    enabled: !!product?.id,
  });

  // Fetch AI Product Recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['ai-recommendations', product?.id],
    queryFn: () => aiApi.getProductRecommendations(product!.id).then((res) => res.data),
    enabled: !!product?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Produce Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">
          The requested harvest item may be seasonal or currently unlisted.
        </p>
        <Link to="/products">
          <Button variant="primary">Browse All Fresh Produce</Button>
        </Link>
      </div>
    );
  }

  const primaryImg = selectedImage || product.primary_image || '/placeholder-produce.jpg';
  const minQty = parseFloat(product.minimum_order_qty || '1');
  const isOut = product.status === 'OUT_OF_STOCK';

  // Check if item is already in current cart
  const existingCartItem = cart?.items?.find((it) => it.product?.id === product.id);

  // Calculate volume tiered price
  let unitPrice = parseFloat(product.price);
  if (product.volume_tiers && product.volume_tiers.length > 0) {
    const matchingTier = [...product.volume_tiers]
      .sort((a, b) => parseFloat(b.min_quantity) - parseFloat(a.min_quantity))
      .find((t) => quantity >= parseFloat(t.min_quantity));
    if (matchingTier && matchingTier.unit_price) {
      unitPrice = parseFloat(matchingTier.unit_price);
    }
  }

  const calculatedTotal = (unitPrice * quantity).toFixed(2);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      setErrorMessage(null);
      await addToCart(product.id, quantity);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await favoritesApi.toggleFavorite({ product_id: product.id });
      setIsFav(res.data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-400">
        <Link to="/" className="hover:text-forest-700">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-forest-700">Produce</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-800 font-semibold truncate">{product.name}</span>
      </nav>

      {/* Main Product Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-soft relative group">
            <OptimizedImage
              src={primaryImg}
              blurPlaceholder={product.blur_placeholder}
              alt={product.name}
              priority="high"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              containerClassName="w-full h-full"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.is_organic && <Badge variant="organic">100% Certified Organic</Badge>}
              {product.is_preorder && (
                <span className="bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Pre-Harvest Advance Order
                </span>
              )}
              <Badge variant="status" statusValue={product.status} />
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url || img.image)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    primaryImg === (img.image_url || img.image) ? 'border-forest-600 shadow-sm' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <OptimizedImage
                    thumbnailSrc={img.thumbnail_url}
                    src={img.image_url || img.image}
                    blurPlaceholder={img.blur_placeholder}
                    alt={img.alt_text || product.name}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Purchasing */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <Link
                to={`/farmers/${product.farmer.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-800 uppercase tracking-wider"
              >
                <span>{product.farmer.farm_name}</span>
                {product.farmer.is_verified && <ShieldCheck className="w-4 h-4 text-teal-600" />}
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-forest-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Grower</span>
                </button>

                {isAuthenticated && (
                  <button
                    onClick={handleToggleFavorite}
                    className="p-2 rounded-full border border-stone-200 text-stone-400 hover:text-rose-500 hover:bg-stone-50 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display">
              {product.name}
            </h1>

            {/* Ratings & Harvest Date */}
            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs">
              <StarRating rating={product.rating_avg} count={product.rating_count} size="md" />
              <div className="flex items-center gap-1 text-stone-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-forest-600" />
                <span>
                  {product.is_preorder && product.expected_harvest_date
                    ? `Expected Harvest: ${product.expected_harvest_date}`
                    : `Harvest Date: ${product.harvest_date}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-stone-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{product.farmer.province}, Cambodia</span>
              </div>
            </div>
          </div>

          {/* Volume Discount Table */}
          <VolumeDiscountTable
            basePrice={product.price}
            unit={product.unit}
            tiers={product.volume_tiers}
            selectedQuantity={quantity}
          />

          {/* Pricing Card */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-900">${unitPrice.toFixed(2)}</span>
                <span className="text-sm font-semibold text-stone-500 lowercase">per {product.unit}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-stone-400 font-medium">Subtotal:</div>
                <div className="text-xl font-extrabold text-forest-800">${calculatedTotal}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-600">
              <span>Minimum order: <strong>{product.minimum_order_qty} {product.unit}</strong></span>
              <span>•</span>
              <span>Available in stock: <strong>{product.available_stock || 0} {product.unit}</strong></span>
            </div>
          </div>

          {/* Quantity Selector & Checkout Action */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Quantity:</span>
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 transition-colors font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={minQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(minQty, parseFloat(e.target.value) || minQty))}
                  className="w-16 text-center font-bold text-stone-900 text-sm focus:outline-none border-x border-stone-200 py-2"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 transition-colors font-bold text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-stone-500">{product.unit}</span>
            </div>

            {/* In Cart Indicator */}
            {existingCartItem && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Currently in your cart: {existingCartItem.quantity} {product.unit}
                </span>
                <Link
                  to="/customer/cart"
                  className="font-extrabold text-forest-800 hover:text-forest-950 underline text-xs"
                >
                  View Cart & Checkout →
                </Link>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                <span className="font-bold">⚠️ {errorMessage}</span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              isLoading={isAdding}
              disabled={isOut || isAdding}
              className="w-full rounded-2xl font-bold"
              leftIcon={isAdded ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            >
              {isOut ? 'Out of Stock' : isAdded ? 'Added to Cart ✓' : `Add ${quantity} ${product.unit} to Cart ($${calculatedTotal})`}
            </Button>
          </div>

          {/* Farm-Direct Assurances */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
              <Truck className="w-4 h-4 text-forest-600 shrink-0" />
              <span>Direct Farm Dispatch</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
              <Award className="w-4 h-4 text-forest-600 shrink-0" />
              <span>Freshness Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Narrative Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
        <h3 className="text-base font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-3">
          About this Harvest & Cultivation
        </h3>
        <div className="prose prose-stone text-xs text-stone-700 leading-relaxed max-w-none">
          <p>{product.description || product.short_description}</p>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <h3 className="text-lg font-bold text-stone-900">
            Verified Buyer Reviews ({reviewsData?.count || 0})
          </h3>
          <StarRating rating={product.rating_avg} size="md" />
        </div>

        {reviewsData?.results.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200 text-xs text-stone-500">
            No verified reviews yet. Purchase this produce to be the first to review!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsData?.results.map((rev) => (
              <div key={rev.id} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-800 font-bold flex items-center justify-center text-xs">
                      {rev.customer_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-stone-900 text-xs">{rev.customer_name}</span>
                  </div>
                  <StarRating rating={rev.rating} size="sm" />
                </div>
                <h4 className="font-bold text-stone-900 text-xs">{rev.title}</h4>
                <p className="text-xs text-stone-600">{rev.comment}</p>
                <div className="text-[10px] text-stone-400">{new Date(rev.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Produce Recommendations: You Might Also Like */}
      {recommendations && recommendations.length > 0 && (
        <div className="pt-8 border-t border-stone-200 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-forest-600" />
                Handpicked Pairings
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                You Might Also Like
              </h2>
            </div>
            <Link to="/products" className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1">
              Explore More Produce →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <ProductCard key={rec.id} product={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Inquire / Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        farmerId={product.farmer.id}
        farmName={product.farmer.farm_name}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
};
