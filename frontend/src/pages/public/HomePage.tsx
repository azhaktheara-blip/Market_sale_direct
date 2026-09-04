import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Search,
  CheckCircle2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { productsApi, farmersApi } from '../../api';
import { ProductCard } from '../../components/cards/ProductCard';
import { FarmerCard } from '../../components/cards/FarmerCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';
import { PageTransition } from '../../components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '../../components/motion/StaggerContainer';
import { OptimizedImage } from '../../components/common/OptimizedImage';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = React.useState('');
  const [showMobileCTA, setShowMobileCTA] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 400px (approx hero section on mobile)
      setShowMobileCTA(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then((res) => res.data),
  });

  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsApi.getProducts({ is_featured: true, page_size: 8 }).then((res) => res.data),
  });

  const { data: featuredFarmers } = useQuery({
    queryKey: ['featured-farmers'],
    queryFn: () => farmersApi.getFarmers({ page_size: 3 }).then((res) => res.data),
  });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleQuickSearch = (term: string) => {
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const quickChips = [
    { label: '🍅 Vine Tomatoes', query: 'tomato' },
    { label: '🥭 Keo Romeat Mango', query: 'mango' },
    { label: '🌶️ Kampot Pepper', query: 'pepper' },
    { label: '☕ Mondulkiri Coffee', query: 'coffee' },
    { label: '🥬 Organic Greens', query: 'vegetable' },
  ];

  return (
    <PageTransition className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-50/80 via-emerald-50/30 to-stone-50 pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-100/90 border border-forest-200 text-forest-800 text-xs font-bold uppercase tracking-wider shadow-xs"
              >
                <Sprout className="w-4 h-4 text-forest-600" />
                <span>100% Farm-Direct Produce</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-[1.08] font-display tracking-tight">
                Eat Healthier With <br className="hidden sm:block" />
                <span className="text-forest-600">Fresh Local Harvests</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Skip the supermarket. Get organic vegetables, exotic fruits, and fresh dairy delivered straight from independent Cambodian farmers to your door within 24 hours of harvest.
              </p>

              <div className="pt-4 flex flex-col items-center lg:items-start gap-3">
                <Link to="/products" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 font-black shadow-lg shadow-forest-600/20 hover:shadow-forest-600/40 rounded-2xl transform hover:-translate-y-0.5 transition-all">
                    Get Fresh Produce Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-stone-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-forest-500" /> Free Shipping Available</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-forest-500" /> 100% Fresh Guarantee</span>
                </div>
              </div>
            </div>

            {/* Right Visual Stage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-white rounded-3xl p-4 shadow-soft-lg border border-stone-200/80 relative z-10">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 overflow-hidden relative">
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80"
                      alt="Fresh agricultural harvest"
                      priority="high"
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-forest-600 text-white inline-block mb-1 shadow-xs">
                        {t('hero.todays_harvest')}
                      </span>
                      <h4 className="text-sm font-bold">Organic Siem Reap Vine Tomatoes</h4>
                      <p className="text-xs text-stone-200">$2.40 / kg • Sokha Green Farm</p>
                    </div>
                  </div>

                  {/* Single Floating Hero Trust Card */}
                  <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{t('hero.direct_guarantee')}</p>
                        <p className="text-[11px] text-stone-500">{t('hero.direct_guarantee_sub')}</p>
                      </div>
                    </div>
                    <Link to="/products">
                      <Button variant="primary" size="sm" className="text-xs rounded-xl font-bold">
                        {t('hero.shop_now')}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Ambient Blur Backing */}
                <div className="absolute -inset-4 bg-forest-200/40 rounded-full blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST METRICS / STATISTICS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-soft-lg grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          <div className="text-center pt-3 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 font-display">120+</p>
            <p className="text-xs font-bold text-stone-900 mt-1">Verified Local Farms</p>
            <p className="text-[11px] text-stone-500">100% Origin Guaranteed</p>
          </div>
          <div className="text-center pt-3 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 font-display">480+</p>
            <p className="text-xs font-bold text-stone-900 mt-1">Direct Harvest Listings</p>
            <p className="text-[11px] text-stone-500">Zero Middleman Markup</p>
          </div>
          <div className="text-center pt-3 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 font-display">14</p>
            <p className="text-xs font-bold text-stone-900 mt-1">Cambodian Provinces</p>
            <p className="text-[11px] text-stone-500">Nationwide Cold-Chain</p>
          </div>
          <div className="text-center pt-3 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 font-display">99.4%</p>
            <p className="text-xs font-bold text-stone-900 mt-1">Delivery Success</p>
            <p className="text-[11px] text-stone-500">Escrow Protected Payouts</p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US - BENEFITS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">Why Families Love FarmerDirect</h2>
          <p className="text-stone-500 mt-3 text-sm sm:text-base max-w-2xl mx-auto">We're cutting out the middlemen so you eat better and farmers earn more. It's a win-win for everyone.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Picked Today, Eaten Today</h3>
            <p className="text-sm text-stone-600 leading-relaxed">Unlike supermarkets where food sits in warehouses for weeks, our produce is harvested only after you order and delivered within 24 hours.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Fair Prices For Everyone</h3>
            <p className="text-sm text-stone-600 leading-relaxed">By buying direct, you pay less than premium grocery stores, while farmers earn up to 3x more than selling to traditional wholesale brokers.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">100% Quality Guarantee</h3>
            <p className="text-sm text-stone-600 leading-relaxed">We stand behind every leaf and tomato. If your delivery isn't perfectly fresh and delicious, we'll replace it or refund you, no questions asked.</p>
          </div>
        </div>
      </section>

      {/* AI AGRI-TECH SPOTLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>New Release • Agri-Tech Intelligence</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
              Farmer AI Suite: Voice Intake, Computer Vision & Predictions
            </h3>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Try our Khmer voice-to-inventory intake, GPT-4o optical produce grader, and real-time Mekong monsoon harvest predictions.
            </p>
          </div>
          <Link
            to="/farmer-ai"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            <span>Explore Farmer AI Suite</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="bg-stone-50 py-12 sm:py-16 border-y border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-stone-900 font-display">Trusted by 5,000+ Happy Customers</h2>
            <div className="flex items-center justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => <Sparkles key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />)}
              <span className="font-bold text-stone-700 ml-2">4.9 / 5 Average Rating</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-stone-200">
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-sm text-stone-700 italic mb-4">"The tomatoes were so sweet and fresh! I've stopped buying vegetables at the supermarket entirely. Knowing exactly which farm it comes from is amazing."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold">SM</div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Sophea M.</p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Buyer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-stone-200">
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-sm text-stone-700 italic mb-4">"Delivery was exactly on time and the packaging was completely plastic-free. The mangoes from Battambang were the best I've had all season."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">DR</div>
                <div>
                  <p className="text-xs font-bold text-stone-900">David R.</p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Buyer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-stone-200">
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-sm text-stone-700 italic mb-4">"As a restaurant owner, consistent quality is crucial. FarmerDirect connects me straight to the source. Great prices and impeccable freshness."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">KT</div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Kosal T.</p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Restaurant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">{t('cat.explore_title')}</h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">{t('cat.explore_sub')}</p>
          </div>
          <Link to="/products" className="text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 flex items-center gap-1">
            {t('cat.all_products')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoriesData?.map((cat) => (
            <StaggerItem key={cat.id}>
              <Link
                to={`/products?category=${cat.slug}`}
                className="group bg-white rounded-3xl p-5 border border-stone-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all text-center flex flex-col items-center justify-center h-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-forest-50 group-hover:bg-forest-100 text-forest-700 flex items-center justify-center text-2xl mb-3 transition-colors shadow-2xs">
                  {cat.slug === 'fresh-vegetables' && '🥬'}
                  {cat.slug === 'tropical-fruits' && '🥭'}
                  {cat.slug === 'grains-rice' && '🌾'}
                  {cat.slug === 'herbs-spices' && '🌶️'}
                  {cat.slug === 'dairy-eggs' && '🥚'}
                  {cat.slug === 'artisanal-processed' && '🍯'}
                </div>
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-forest-700 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-stone-400 font-medium mt-0.5">
                  {cat.product_count || 0} {t('cat.listings')}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* 3. FRESH SEASONAL HARVEST (FEATURED PRODUCTS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 uppercase tracking-wider mb-1">
              <Sprout className="w-3.5 h-3.5" />
              Fresh From Field
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">Seasonal Fresh Harvest</h2>
          </div>
          <Link to="/products" className="text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 flex items-center gap-1">
            Browse All ({featuredProducts?.count || 0}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {featuredProducts?.results.map((product, idx) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} priority={idx < 4 ? 'high' : 'auto'} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* 4. WHY BUY DIRECTLY? (TRUST PILLARS) */}
      <section className="bg-stone-900 text-white py-16 sm:py-20 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display">{t('trust.why_buy')}</h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-2">
              {t('trust.why_buy_sub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-stone-800/80 border border-stone-700/60 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-900/80 border border-forest-600 text-forest-400 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">{t('trust.freshness_title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('trust.freshness_desc')}
              </p>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/60 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-900/80 border border-teal-600 text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">{t('trust.provenance_title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('trust.provenance_desc')}
              </p>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/60 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-900/80 border border-amber-600 text-amber-400 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">{t('trust.fair_price_title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('trust.fair_price_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED VERIFIED FARMERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Meet The Growers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">Featured Local Farms</h2>
          </div>
          <Link to="/farmers" className="text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 flex items-center gap-1">
            All Farms <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredFarmers?.results.map((farmer) => (
            <StaggerItem key={farmer.id}>
              <FarmerCard farmer={farmer} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest-700 via-forest-800 to-stone-900 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-soft-lg">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">{t('cta.producer_title')}</h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-lg">
              {t('cta.producer_desc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/register">
              <Button variant="amber" size="lg" className="w-full sm:w-auto font-bold">
                {t('cta.become_farmer')}
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/40 hover:bg-white/10 font-semibold">
                {t('cta.learn_more')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA BAR */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transform transition-transform duration-300 md:hidden ${
          showMobileCTA ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <Link to="/products" className="block w-full">
          <Button variant="primary" size="lg" className="w-full font-black text-sm py-3.5 shadow-lg shadow-forest-600/20">
            Get Fresh Produce Now
          </Button>
        </Link>
      </div>
    </PageTransition>
  );
};
