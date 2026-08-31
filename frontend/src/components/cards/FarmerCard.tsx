import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Award, ArrowRight, Package } from 'lucide-react';
import { FarmerProfile } from '../../types';
import { Badge } from '../common/Badge';
import { StarRating } from '../common/StarRating';

interface FarmerCardProps {
  farmer: FarmerProfile;
}

export const FarmerCard: React.FC<FarmerCardProps> = ({ farmer }) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-soft hover:shadow-soft-lg transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Cover Header */}
      <div className="relative h-28 bg-gradient-to-r from-forest-800 to-stone-800 overflow-hidden">
        {farmer.cover_image && (
          <img
            src={farmer.cover_image}
            alt={farmer.farm_name}
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="status" size="sm" className="bg-white/90 backdrop-blur-sm text-stone-800 font-semibold border-none">
            {farmer.farming_practice}
          </Badge>
        </div>
      </div>

      {/* Profile & Info */}
      <div className="p-5 pt-0 flex-1 flex flex-col relative">
        {/* Avatar */}
        <div className="-mt-9 mb-3 flex items-end justify-between">
          <div className="relative w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-forest-700 font-bold text-xl bg-forest-100">
            {farmer.profile_image ? (
              <img src={farmer.profile_image} alt={farmer.farm_name} className="w-full h-full object-cover" />
            ) : (
              <span>🚜</span>
            )}
          </div>
          {farmer.is_verified && (
            <Badge variant="verified" size="sm">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verified Farm
            </Badge>
          )}
        </div>

        {/* Name & Location */}
        <Link to={`/farmers/${farmer.slug}`} className="block mb-1.5">
          <h3 className="text-base font-bold text-stone-900 group-hover:text-forest-700 transition-colors line-clamp-1">
            {farmer.farm_name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-stone-500 mb-2.5">
          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>{farmer.district ? `${farmer.district}, ` : ''}{farmer.province}</span>
        </div>

        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
          {farmer.bio || farmer.story}
        </p>

        {/* Stats Row */}
        <div className="mt-auto pt-3.5 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <StarRating rating={farmer.rating_avg} count={farmer.rating_count} size="sm" />
          </div>
          <div className="flex items-center justify-end gap-1 text-stone-500 font-medium">
            <Package className="w-3.5 h-3.5 text-stone-400" />
            <span>{farmer.product_count || 0} produce items</span>
          </div>
        </div>

        {/* Link Button */}
        <Link
          to={`/farmers/${farmer.slug}`}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-forest-50 text-stone-700 hover:text-forest-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-stone-200/60"
        >
          <span>View Farm Produce</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

