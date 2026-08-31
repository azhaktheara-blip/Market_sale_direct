import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'badge' | 'button';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'badge',
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'button') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-forest-400 bg-white hover:bg-forest-50/50 text-xs font-bold transition-all shadow-2xs ${className}`}
        title="Switch Language / ប្តូរភាសា"
      >
        <Globe className="w-3.5 h-3.5 text-forest-600" />
        <span className={language === 'km' ? 'font-bold text-forest-800' : 'text-stone-700'}>
          {language === 'km' ? '🇰🇭 ភាសាខ្មែរ' : '🇬🇧 English'}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`relative px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
          language === 'en'
            ? 'bg-white text-stone-900 shadow-xs'
            : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        <span>🇬🇧 EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('km')}
        className={`relative px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
          language === 'km'
            ? 'bg-forest-600 text-white shadow-xs'
            : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        <span>🇰🇭 ខ្មែរ</span>
      </button>
    </div>
  );
};

