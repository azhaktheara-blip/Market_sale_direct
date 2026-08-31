import React, { useState } from 'react';
import { Sprout } from 'lucide-react';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  thumbnailSrc?: string | null;
  mediumSrc?: string | null;
  blurPlaceholder?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: 'high' | 'low' | 'auto';
  loading?: 'lazy' | 'eager';
  fallbackIconSize?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  thumbnailSrc,
  mediumSrc,
  blurPlaceholder,
  alt,
  className = '',
  containerClassName = '',
  priority = 'auto',
  loading = 'lazy',
  fallbackIconSize = 32,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Preferred image URL resolution: full/medium/thumbnail
  const imageSource = src || mediumSrc || thumbnailSrc;

  // If priority is 'high', force eager loading and avoid lazy loading per web performance guidelines
  const effectiveLoading = priority === 'high' ? 'eager' : loading;

  if (!imageSource || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-stone-100 flex flex-col items-center justify-center text-stone-400 select-none ${containerClassName || className}`}
      >
        <Sprout size={fallbackIconSize} className="text-stone-300 stroke-[1.5]" />
        <span className="text-[10px] font-medium text-stone-400 mt-1 uppercase tracking-wider">
          Fresh Harvest
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-stone-100 ${containerClassName}`}
    >
      {/* Blurred Micro-Placeholder Skeleton */}
      {blurPlaceholder && !isLoaded && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 transform"
        />
      )}

      {/* Main High-Res / Compressed WebP Image */}
      <img
        src={imageSource}
        alt={alt}
        loading={effectiveLoading}
        // @ts-expect-error - fetchpriority is standard in modern browsers
        fetchpriority={priority !== 'auto' ? priority : undefined}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-300 ease-out ${
          isLoaded ? 'opacity-100 scale-100 filter-none' : 'opacity-0 scale-105 filter blur-xs'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
