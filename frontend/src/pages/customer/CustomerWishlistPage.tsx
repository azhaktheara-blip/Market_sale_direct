import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { favoritesApi } from '../../api';
import { ProductCard } from '../../components/cards/ProductCard';
import { FarmerCard } from '../../components/cards/FarmerCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';

export const CustomerWishlistPage: React.FC = () => {
  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getFavorites().then((res) => res.data),
  });

  const productFavorites = favoritesData?.results.filter((f) => f.product) || [];
  const farmerFavorites = favoritesData?.results.filter((f) => f.farmer) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Saved Favorites</h1>
        <p className="text-xs text-stone-500 mt-0.5">Produce items and local growers you have bookmarked.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : favoritesData?.results.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8" />}
          title="No favorites saved yet"
          description="Click the heart icon on any fresh produce or farm profile to save it for quick access."
        />
      ) : (
        <div className="space-y-10">
          {productFavorites.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Favorite Produce ({productFavorites.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productFavorites.map((fav) => (
                  <ProductCard key={fav.id} product={fav.product!} />
                ))}
              </div>
            </div>
          )}

          {farmerFavorites.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Followed Farms ({farmerFavorites.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {farmerFavorites.map((fav) => (
                  <FarmerCard key={fav.id} farmer={fav.farmer as any} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

