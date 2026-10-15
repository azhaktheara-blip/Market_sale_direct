import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareText,
  X,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

export const DemoFeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const feedbackMailto =
    'mailto:support@farmerdirect.com?subject=Market%20Sale%20Direct%20Feedback&body=Hi%20FarmerDirect%20team%2C%0A%0AI%20am%20exploring%20your%20demo%20and%20wanted%20to%20share%20some%20feedback%3A%0A%0A';

  return (
    <aside
      ref={containerRef}
      aria-label="Demonstration Project Assistant"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 select-none"
    >
      {/* Popover Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="demo-feedback-popover"
            role="dialog"
            aria-modal="false"
            aria-labelledby="demo-popover-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full right-0 mb-3 w-[calc(100vw-2rem)] sm:w-[390px] max-w-[420px] bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-2xl rounded-2xl overflow-hidden text-stone-800"
          >
            {/* Header / Eyebrow Banner */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-400" />
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-forest-200">
                  Prototype Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
                aria-label="Close demo details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-[13px] leading-relaxed text-stone-600">
              <div className="space-y-1">
                <h3
                  id="demo-popover-title"
                  className="text-base sm:text-lg font-bold text-stone-900 font-display tracking-tight"
                >
                  You're exploring our demo
                </h3>
              </div>

              {/* Exact Requested Explanatory Paragraphs */}
              <div className="space-y-2.5 text-stone-700">
                <p>
                  Market Sale Direct is currently under development as we explore
                  opportunities in Cambodia's local market.
                </p>
                <p>
                  This website is a demonstration platform, not yet a
                  production-ready business service. Some features and listings
                  may be illustrative.
                </p>
                <p className="font-medium text-stone-900">
                  We're interested in understanding the needs of local buyers and
                  sellers. Your feedback can help shape what we build next.
                </p>
              </div>

              {/* Action Buttons & Contact Channels */}
              <div className="pt-2 space-y-2.5">
                <a
                  href={feedbackMailto}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-medium text-xs sm:text-sm shadow-sm transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Share your feedback</span>
                </a>

                <div className="grid grid-cols-2 gap-2 text-stone-700">
                  <a
                    href="tel:+85512888999"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-[11px] font-medium text-stone-700 hover:text-stone-900 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-forest-600" />
                    <span>+855 12 888 999</span>
                  </a>

                  <Link
                    to="/about"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-[11px] font-medium text-stone-700 hover:text-stone-900 transition-colors"
                  >
                    <span>Our Story</span>
                    <ArrowRight className="w-3 h-3 text-stone-400" />
                  </Link>
                </div>
              </div>

              {/* Subtle Footer Note */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>Phnom Penh & Siem Reap, Cambodia</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-stone-500 hover:text-stone-800 underline font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Pill Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="demo-feedback-popover"
        aria-label={isOpen ? 'Close demo details' : 'About this demo'}
        className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 ${
          isOpen
            ? 'bg-stone-900 text-white border-stone-800'
            : 'bg-white/95 text-stone-800 hover:text-stone-900 border-stone-200/90 hover:border-stone-300 backdrop-blur-md'
        }`}
      >
        {isOpen ? (
          <X className="w-4 h-4 text-white" />
        ) : (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-forest-600" />
            </span>
            <MessageSquareText className="w-4 h-4 text-forest-700 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold tracking-tight text-stone-800">
              About this demo
            </span>
          </>
        )}
      </button>
    </aside>
  );
};
