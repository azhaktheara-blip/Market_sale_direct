import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface AnimatedCountProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCount: React.FC<AnimatedCountProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 120,
    damping: 18,
  });

  const display = useTransform(spring, (current) => {
    return `${prefix}${current.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  if (shouldReduceMotion) {
    return <span className={className}>{prefix}{value.toFixed(decimals)}{suffix}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
};

