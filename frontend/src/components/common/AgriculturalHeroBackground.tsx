import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AgriculturalHeroBackgroundProps {
  className?: string;
  videoUrl?: string;
  overlayOpacity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulseSpeed: number;
  pulseVal: number;
  color: string;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  swaySpeed: number;
  swayAmplitude: number;
  swayOffset: number;
  opacity: number;
  hue: number;
}

export const AgriculturalHeroBackground: React.FC<AgriculturalHeroBackgroundProps> = ({
  className = '',
  videoUrl,
  overlayOpacity = 0.55,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // High-performance 60 FPS Canvas Leaf & Ambient Light Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // 1. Floating Golden Ambient Particles (Sunlight dust / morning pollen)
    const particleCount = Math.min(35, Math.floor(width / 40));
    const particles: Particle[] = [];
    const particleColors = ['#fde047', '#fef08a', '#a7f3d0', '#6ee7b7', '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedX: (Math.random() - 0.2) * 0.4,
        speedY: -(Math.random() * 0.35 + 0.1),
        opacity: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseVal: Math.random() * Math.PI * 2,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      });
    }

    // 2. Small Organic Green Leaves Drifting with Morning Wind
    const leafCount = Math.min(18, Math.floor(width / 75));
    const leaves: Leaf[] = [];

    for (let i = 0; i < leafCount; i++) {
      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 10 + 9,
        speedX: Math.random() * 0.8 + 0.6, // gentle breeze to the right
        speedY: Math.random() * 0.4 + 0.2, // gentle downward drift
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.2,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.03 + 0.015,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayAmplitude: Math.random() * 25 + 15,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.55 + 0.35,
        hue: Math.floor(Math.random() * 30 + 115), // emerald to forest green
      });
    }

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // --- Render Golden Sun Dust Particles ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulseVal += p.pulseSpeed;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulseVal));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Wrap around seamlessly
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
      }

      ctx.shadowBlur = 0;

      // --- Render Drifting Fresh Leaves ---
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        leaf.swayOffset += leaf.swaySpeed;
        const sway = Math.sin(leaf.swayOffset) * 0.6;

        leaf.x += leaf.speedX + sway;
        leaf.y += leaf.speedY;
        leaf.rotation += leaf.rotationSpeed;
        leaf.flip += leaf.flipSpeed;

        const scaleY = Math.cos(leaf.flip);

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate((leaf.rotation * Math.PI) / 180);
        ctx.scale(1, Math.max(0.15, Math.abs(scaleY)));
        ctx.globalAlpha = leaf.opacity;

        // Draw leaf geometry (pointed organic curved leaf shape)
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size);
        ctx.bezierCurveTo(
          leaf.size * 0.7,
          -leaf.size * 0.4,
          leaf.size * 0.6,
          leaf.size * 0.5,
          0,
          leaf.size
        );
        ctx.bezierCurveTo(
          -leaf.size * 0.6,
          leaf.size * 0.5,
          -leaf.size * 0.7,
          -leaf.size * 0.4,
          0,
          -leaf.size
        );
        ctx.closePath();

        // Gradient for natural depth
        const leafGrad = ctx.createLinearGradient(0, -leaf.size, 0, leaf.size);
        leafGrad.addColorStop(0, `hsla(${leaf.hue}, 68%, 52%, 0.95)`);
        leafGrad.addColorStop(0.5, `hsla(${leaf.hue - 5}, 72%, 40%, 0.9)`);
        leafGrad.addColorStop(1, `hsla(${leaf.hue - 15}, 65%, 30%, 0.85)`);

        ctx.fillStyle = leafGrad;
        ctx.fill();

        // Subtle leaf center vein
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size * 0.85);
        ctx.lineTo(0, leaf.size * 0.75);
        ctx.strokeStyle = `hsla(${leaf.hue + 15}, 60%, 75%, 0.45)`;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.restore();

        // Wrap around seamlessly
        if (leaf.x > width + 40) {
          leaf.x = -30;
          leaf.y = Math.random() * height;
        }
        if (leaf.y > height + 40) {
          leaf.y = -30;
          leaf.x = Math.random() * width;
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. CINEMATIC BACKGROUND VIDEO / HIGH-RES MATTE LAYER */}
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : null}

      {/* Photorealistic Cambodian Agricultural Panoramic Backdrop with Smooth Slow-Pan & Zoom (Ken Burns Effect) */}
      <motion.div
        initial={{ scale: 1.0, x: 0, y: 0 }}
        animate={{
          scale: [1.0, 1.06, 1.02, 1.0],
          x: [0, -12, -6, 0],
          y: [0, -8, -4, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -inset-8 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2200&q=85')`,
          filter: 'saturate(1.18) contrast(1.04) brightness(0.98)',
        }}
      />

      {/* 2. LAYERED DISTANT MIST & MORNING CLOUD DRIFT */}
      <motion.div
        animate={{ x: ['-20%', '0%', '-20%'] }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 w-[200%] h-1/2 opacity-35 bg-gradient-to-b from-amber-100/30 via-emerald-100/20 to-transparent blur-3xl pointer-events-none"
      />

      {/* 3. VOLUMETRIC SOFT SUNLIGHT RAYS (GOD RAYS) */}
      <div className="absolute -top-24 left-1/4 w-96 h-[130%] pointer-events-none opacity-40">
        <motion.div
          animate={{
            opacity: [0.3, 0.55, 0.35, 0.3],
            rotate: [-2, 3, -1, -2],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full origin-top"
          style={{
            background:
              'conic-gradient(from 180deg at 50% 0%, rgba(254, 240, 138, 0.28) 0deg, transparent 25deg, rgba(253, 224, 71, 0.35) 45deg, transparent 75deg, rgba(254, 240, 138, 0.2) 110deg, transparent 180deg)',
            filter: 'blur(35px)',
          }}
        />
      </div>

      {/* 4. SOFT WIND WAVES (Rippling grass & rice fields in foreground) */}
      <div className="absolute bottom-0 inset-x-0 h-48 opacity-30 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, -60, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[120%] h-full bg-gradient-to-t from-emerald-900/40 via-forest-800/20 to-transparent blur-xl"
        />
      </div>

      {/* 5. 60 FPS HTML5 CANVAS (Floating Leaves & Sunlight Motes) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 6. DESIGN REQUIREMENT: SUBTLE READABILITY OVERLAY */}
      {/* Clean center area, subtle dark/forest green vignette ensuring 100% text readability */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `
            radial-gradient(ellipse at 35% 40%, rgba(255, 255, 255, 0.72) 0%, rgba(247, 254, 231, 0.82) 40%, rgba(236, 253, 245, 0.92) 80%, rgba(240, 253, 244, 0.97) 100%),
            linear-gradient(to right, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.82) 45%, rgba(255, 255, 255, 0.45) 85%, rgba(255, 255, 255, 0.25) 100%),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.85) 0%, transparent 20%, transparent 70%, rgba(250, 250, 249, 1) 100%)
          `,
          opacity: overlayOpacity,
        }}
      />

      {/* Subtle tech-mesh dot grid for modern AgriTech feel */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#065f46 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

export default AgriculturalHeroBackground;
