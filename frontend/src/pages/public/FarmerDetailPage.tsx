import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Phone,
  Globe,
  Award,
  ChevronRight,
  Package,
  MessageSquare,
} from 'lucide-react';
import { farmersApi, reviewsApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { StarRating } from '../../components/common/StarRating';
import { ProductCard } from '../../components/cards/ProductCard';
import { Skeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';
import { ChatModal } from '../../components/messaging/ChatModal';

export const FarmerDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: farmer, isLoading, isError } = useQuery({
    queryKey: ['farmer', slug],
    queryFn: () => farmersApi.getFarmerBySlug(slug!).then((res) => res.data),
    enabled: !!slug,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['farmer-reviews', farmer?.id],
    queryFn: () => reviewsApi.getFarmerReviews(farmer!.id).then((res) => res.data),
    enabled: !!farmer?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Farmer Profile Not Found</h2>
        <p className="text-stone-500 mb-6">The farm you are looking for may have updated its profile link.</p>
        <Link to="/farmers">
          <Button variant="primary">Browse All Farmers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link to="/" className="hover:text-stone-900">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/farmers" className="hover:text-stone-900">Farmers</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-900 truncate">{farmer.farm_name}</span>
      </nav>

      {/* Hero Farm Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-soft-lg">
        <div className="h-56 sm:h-72 bg-gradient-to-r from-forest-900 to-stone-900 relative">
          {farmer.cover_image ? (
            <img src={farmer.cover_image} alt={farmer.farm_name} className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20 text-8xl">🚜</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 pt-0 relative -mt-16 sm:-mt-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-stone-900 overflow-hidden shadow-xl flex items-center justify-center text-4xl bg-forest-100 shrink-0">
              {farmer.profile_image ? (
                <img src={farmer.profile_image} alt={farmer.farm_name} className="w-full h-full object-cover" />
              ) : (
                <span>🌱</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  {farmer.farm_name}
                </h1>
                {farmer.is_verified && (
                  <Badge variant="verified" size="sm">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Verified Farm ✓
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-forest-400" />
                  {farmer.district ? `${farmer.district}, ` : ''}{farmer.province}, Cambodia
                </span>
                <span>•</span>
                <span>{farmer.years_of_experience} Years Farming Experience</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-stone-800/80 backdrop-blur-md rounded-2xl p-3 border border-stone-700/60 text-right">
              <StarRating rating={farmer.rating_avg} count={farmer.rating_count} size="md" />
              <span className="text-[10px] text-stone-400 block mt-0.5">Verified Customer Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Farm Story & Products */}
        <div className="lg:col-span-8 space-y-10">
          {/* Farm Story & Values */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-4">
            <h2 className="text-xl font-bold text-stone-900">About Our Farm & Traditions</h2>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {farmer.story || farmer.bio}
            </p>

            <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-forest-50/60 border border-forest-100 text-forest-900">
                <Award className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Farming Practice</strong>
                  <span>{farmer.farming_practice}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-amber-900">
                <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Direct Harvest</strong>
                  <span>Zero cold-storage holdover; shipped fresh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Produce from This Farmer */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Fresh Produce from this Farm</h2>
                <p className="text-xs text-stone-500 mt-0.5">Currently available harvest ready for delivery.</p>
              </div>
              <span className="text-xs font-bold text-forest-700">{farmer.products?.length || 0} listings</span>
            </div>

            {farmer.products && farmer.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {farmer.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
                No active produce listings at this moment. Check back soon for the next harvest!
              </div>
            )}
          </div>

          {/* Customer Reviews for this Farm */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Farm Reviews & Ratings</h2>
                <p className="text-xs text-stone-500 mt-0.5">Feedback from customers who bought from {farmer.farm_name}.</p>
              </div>
              <StarRating rating={farmer.rating_avg} count={farmer.rating_count} size="md" />
            </div>

            {reviewsData?.results.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                No reviews yet for this farm.
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsData?.results.map((rev) => (
                  <div key={rev.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{rev.customer_name}</span>
                      <span className="text-[11px] text-stone-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <StarRating rating={rev.rating} size="sm" showScore={false} />
                    <h4 className="text-xs font-bold text-stone-900">{rev.title}</h4>
                    <p className="text-xs text-stone-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Farm Address & Contact */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Farm Location & Contact</h3>
            <div className="space-y-3 text-xs text-stone-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900">Physical Address:</strong>
                  <span>{farmer.address_line}, {farmer.district}, {farmer.province}</span>
                </div>
              </div>

              {farmer.phone_number && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{farmer.phone_number}</span>
                </div>
              )}

              {farmer.website_url && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-stone-400 shrink-0" />
                  <a href={farmer.website_url} target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">
                    {farmer.website_url}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${
                  farmer.latitude && farmer.longitude
                    ? `${farmer.latitude},${farmer.longitude}`
                    : encodeURIComponent(`${farmer.farm_name}, ${farmer.district}, ${farmer.province}, Cambodia`)
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-forest-50 text-forest-800 text-xs font-bold hover:bg-forest-100 transition-colors border border-forest-200"
              >
                <MapPin className="w-4 h-4 text-forest-600" />
                <span>View Farm on Google Maps</span>
              </a>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsChatOpen(true)}
                className="w-full rounded-xl"
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Message & Inquire
              </Button>
            </div>

            <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              <p>All orders placed through FarmerDirect are protected by direct dispute resolution and verified payment escrow.</p>
            </div>
          </div>
        </div>
      </div>

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        farmerId={farmer.id}
        farmName={farmer.farm_name}
      />
    </div>
  );
};

