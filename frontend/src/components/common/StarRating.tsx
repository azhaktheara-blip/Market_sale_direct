import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | string;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  count,
  interactive = false,
  onRatingChange,
  size = 'md',
  showScore = true,
}) => {
  const numericRating = typeof rating === 'string' ? parseFloat(rating) || 0 : rating;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = starIndex <= Math.round(numericRating);
          return (
            <button
              type="button"
              key={starIndex}
              disabled={!interactive}
              onClick={() => interactive && onRatingChange?.(starIndex)}
              className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  filled ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showScore && (
        <span className="text-xs font-semibold text-stone-700 ml-0.5">
          {numericRating.toFixed(1)}
          {count !== undefined && <span className="text-stone-400 font-normal"> ({count})</span>}
        </span>
      )}
    </div>
  );
};

