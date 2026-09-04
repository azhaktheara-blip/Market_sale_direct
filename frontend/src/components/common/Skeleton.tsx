import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'relative overflow-hidden rounded-xl bg-stone-200/70 after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent',
          className
        )
      )}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200/80 shadow-soft flex flex-col justify-between overflow-hidden">
      <div>
        <Skeleton className="w-full aspect-[4/3] rounded-2xl mb-3" />
        <div className="flex items-center justify-between gap-2 mb-2">
          <Skeleton className="w-24 h-3.5 rounded-md" />
          <Skeleton className="w-14 h-3.5 rounded-md" />
        </div>
        <Skeleton className="w-3/4 h-5 rounded-md mb-2.5" />
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-4 rounded-full" />
          <Skeleton className="w-16 h-3.5 rounded-md" />
        </div>
      </div>
      <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
        <Skeleton className="w-16 h-6 rounded-md" />
        <Skeleton className="w-20 h-8 rounded-xl sm:rounded-2xl" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="border-b border-stone-100 animate-pulse">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

