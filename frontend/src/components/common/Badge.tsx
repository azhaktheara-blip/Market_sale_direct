import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, Leaf, ShieldCheck, Clock, Truck, AlertCircle } from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'organic' | 'verified' | 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'status';
  statusValue?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  statusValue,
  size = 'md',
  className,
}) => {
  let selectedVariant = variant;
  let label = children;
  let icon: React.ReactNode = null;

  if (statusValue) {
    switch (statusValue) {
      case 'PENDING':
        selectedVariant = 'warning';
        label = label || 'Pending Confirmation';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      case 'CONFIRMED':
        selectedVariant = 'info';
        label = label || 'Confirmed';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      case 'PREPARING':
        selectedVariant = 'info';
        label = label || 'Harvesting & Packing';
        icon = <Leaf className="w-3 h-3 mr-1" />;
        break;
      case 'READY':
        selectedVariant = 'info';
        label = label || 'Ready for Pickup';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      case 'OUT_FOR_DELIVERY':
        selectedVariant = 'warning';
        label = label || 'Out for Delivery';
        icon = <Truck className="w-3 h-3 mr-1" />;
        break;
      case 'DELIVERED':
        selectedVariant = 'success';
        label = label || 'Delivered';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      case 'CANCELLED':
      case 'REJECTED':
        selectedVariant = 'danger';
        label = label || statusValue;
        icon = <AlertCircle className="w-3 h-3 mr-1" />;
        break;
      case 'ACTIVE':
        selectedVariant = 'success';
        label = label || 'In Stock';
        break;
      case 'OUT_OF_STOCK':
        selectedVariant = 'danger';
        label = label || 'Out of Stock';
        break;
    }
  }

  const variants = {
    organic: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
    verified: 'bg-teal-50 text-teal-800 border-teal-200 font-semibold',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    status: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  if (variant === 'organic' && !icon) {
    icon = <Leaf className="w-3 h-3 mr-1 text-emerald-600" />;
  }
  if (variant === 'verified' && !icon) {
    icon = <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />;
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border',
          variants[selectedVariant],
          sizes[size],
          className
        )
      )}
    >
      {icon}
      {label}
    </span>
  );
};

