import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface AnimatedHeroProduceCardProps {
  className?: string;
  imageSrc?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  dispatchTitle?: string;
  dispatchSub?: string;
}

export const AnimatedHeroProduceCard: React.FC<AnimatedHeroProduceCardProps> = ({
  className = '',
  imageSrc = 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=85',
  badgeText = 'FEATURED HARVEST',
  title = 'Organic Siem Reap Vine Tomatoes',
  subtitle = '$2.40 / kg • Sokha Green Farm',
  dispatchTitle = 'Direct Farm Dispatch',
  dispatchSub = 'Zero middleman cold warehouses',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt interactive physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), {
    stiffness: 150,
    damping: 15,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), {
    stiffness: 150,
    damping: 15,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <div className={`relative mx-auto max-w-md lg:max-w-none perspective-1000 ${className}`}>
      {/* 1. Ambient Breathing Green Glow Behind Card */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-4 bg-gradient-to-r from-emerald-400/40 via-forest-500/30 to-amber-300/30 rounded-[2.5rem] blur-2xl -z-10 pointer-events-none"
      />

      {/* 2. Floating Micro-Leaf Accents around Card */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          x: [-4, 4, -4],
          rotate: [0, 15, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-3 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md border border-emerald-200 z-20 pointer-events-none"
      >
        <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
      </motion.div>

      {/* 3. Main Floating 3D Card Container */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          y: [-5, 5, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-soft-xl border border-stone-200/90 relative z-10 transition-shadow duration-300 hover:shadow-2xl"
      >
        {/* 4. Visual Produce Stage with Cinematic Motion (Like Video) */}
        <div className="aspect-[4/3] rounded-2xl bg-stone-900 overflow-hidden relative group">
          {/* Continuous Cinematic Video-Like Drift / Pan */}
          <motion.img
            src={imageSrc}
            alt={title}
            loading="eager"
            animate={{
              scale: [1.0, 1.07, 1.03, 1.0],
              x: [0, -6, 4, 0],
              y: [0, -4, -2, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full object-cover select-none"
          />

          {/* Animated Light Sheen Glint (sweeps across the fresh produce every 6s) */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
          />

          {/* Natural Vignette Overlay for Crisp Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent pointer-events-none" />

          {/* Top Live Freshness Tag */}
          <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute" />
            <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider">Harvested Today</span>
          </div>

          {/* Bottom Card Metadata Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{badgeText}</span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm font-display">
              {title}
            </h4>

            <div className="flex items-center justify-between text-xs text-stone-200">
              <span className="font-semibold text-emerald-300 font-mono text-sm">{subtitle.split('•')[0]}</span>
              <span className="text-stone-300 text-[11px] font-medium">{subtitle.split('•')[1] || ''}</span>
            </div>
          </div>
        </div>

        {/* 5. Bottom Interactive Trust Bar */}
        <div className="mt-4 p-3.5 bg-stone-50/90 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 hover:bg-stone-100/90 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-stone-900 leading-tight">
                {dispatchTitle}
              </h5>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {dispatchSub}
              </p>
            </div>
          </div>

          <Link to="/products" className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              className="text-xs px-4 py-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 rounded-xl"
            >
              <span>Shop Produce</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AnimatedHeroProduceCard;
