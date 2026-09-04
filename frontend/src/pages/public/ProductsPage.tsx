import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Filter,
  Sparkles,
  ChevronDown,
  Check,
  RotateCcw,
  Tag,
  Leaf,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { productsApi } from '../../api';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { PageTransition } from '../../components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '../../components/motion/StaggerContainer';
import { AnimatedCount } from '../../components/motion/AnimatedCount';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter state initialized from URL search params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const organicParam = searchParams.get('is_organic') === 'true';
  const provinceParam = searchParams.get('province') || '';
  const orderingParam = searchParams.get('ordering') || '-created_at';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [isOrganic, setIsOrganic] = useState(organicParam);
  const [selectedProvince, setSelectedProvince] = useState(provinceParam);
  const [ordering, setOrdering] = useState(orderingParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);

  // Keep state in sync if URL params change externally
  useEffect(() => {
    setSearchQuery(searchParam);
    setSelectedCategory(categoryParam);
    setIsOrganic(organicParam);
    setSelectedProvince(provinceParam);
    setOrdering(orderingParam);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }, [searchParam, categoryParam, organicParam, provinceParam, orderingParam, minPriceParam, maxPriceParam]);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  const provinces = [
    'Siem Reap',
    'Battambang',
    'Kampot',
    'Kandal',
    'Pursat',
    'Koh Kong',
    'Mondulkiri',
    'Takeo',
    'Kampong Cham',
    'Kratie',
    'Phnom Penh',
  ];

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then((res) => res.data),
  });

  // Fetch Products with active query parameters
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      'products',
      {
        category: selectedCategory,
        search: searchParam,
        is_organic: isOrganic,
        province: selectedProvince,
        ordering,
        min_price: minPrice,
        max_price: maxPrice,
        page: pageParam,
      },
    ],
    queryFn: () =>
      productsApi
        .getProducts({
          category: selectedCategory || undefined,
          search: searchParam || undefined,
          is_organic: isOrganic ? true : undefined,
          province: selectedProvince || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          ordering: ordering || undefined,
          page: pageParam,
          page_size: 12,
        })
        .then((res) => res.data),
  });

  // Sync internal state to URL query params
  const applyFilters = (
    newCategory?: string,
    newOrganic?: boolean,
    newProvince?: string,
    newOrdering?: string,
    newMinPrice?: string,
    newMaxPrice?: string
  ) => {
    const params = new URLSearchParams();
    const cat = newCategory !== undefined ? newCategory : selectedCategory;
    const org = newOrganic !== undefined ? newOrganic : isOrganic;
    const prov = newProvince !== undefined ? newProvince : selectedProvince;
    const ord = newOrdering !== undefined ? newOrdering : ordering;
    const minP = newMinPrice !== undefined ? newMinPrice : minPrice;
    const maxP = newMaxPrice !== undefined ? newMaxPrice : maxPrice;

    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (cat) params.set('category', cat);
    if (org) params.set('is_organic', 'true');
    if (prov) params.set('province', prov);
    if (ord) params.set('ordering', ord);
    if (minP) params.set('min_price', minP);
    if (maxP) params.set('max_price', maxP);
    params.set('page', '1');

    setSearchParams(params);
    setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setIsOrganic(false);
    setSelectedProvince('');
    setOrdering('-created_at');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams());
    setMobileFilterOpen(false);
  };

  const currentPricePreset =
    !minPrice && !maxPrice
      ? 'all'
      : !minPrice && maxPrice === '2'
      ? 'under-2'
      : minPrice === '2' && maxPrice === '5'
      ? '2-5'
      : minPrice === '5' && !maxPrice
      ? 'over-5'
      : 'custom';

  const handleSelectPricePreset = (preset: string) => {
    if (preset === 'all') {
      setMinPrice('');
      setMaxPrice('');
      applyFilters(undefined, undefined, undefined, undefined, '', '');
    } else if (preset === 'under-2') {
      setMinPrice('');
      setMaxPrice('2');
      applyFilters(undefined, undefined, undefined, undefined, '', '2');
    } else if (preset === '2-5') {
      setMinPrice('2');
      setMaxPrice('5');
      applyFilters(undefined, undefined, undefined, undefined, '2', '5');
    } else if (preset === 'over-5') {
      setMinPrice('5');
      setMaxPrice('');
      applyFilters(undefined, undefined, undefined, undefined, '5', '');
    }
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (isOrganic ? 1 : 0) +
    (selectedProvince ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (searchParam ? 1 : 0);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'fresh-vegetables':
        return '🥬';
      case 'tropical-fruits':
        return '🥭';
      case 'grains-rice':
        return '🌾';
      case 'herbs-spices':
        return '🌶️';
      case 'dairy-eggs':
        return '🥚';
      case 'artisanal-processed':
        return '🍯';
      default:
        return '🌱';
    }
  };

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
            Fresh Produce Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Discover{' '}
            <strong className="text-stone-800 font-bold">
              <AnimatedCount value={productsData?.count || 0} />
            </strong>{' '}
            farm-direct crops harvested by verified local growers.
          </p>
        </div>

        {/* Search Bar & Mobile Filter Trigger */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search produce, farm, province..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 focus:border-forest-600 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-100 shadow-2xs font-medium transition-all"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2.5 bg-white border border-stone-300 hover:border-forest-600 rounded-2xl text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 text-xs font-bold shadow-2xs shrink-0 transition-colors"
            aria-label="Open filter options"
          >
            <Filter className="w-4 h-4 text-forest-700" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-forest-600 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. DISCOVERY & RESPONSIVE FILTER BAR ABOVE THE LIST */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-soft space-y-4">
        {/* Category Pills (Horizontal Scroll on Mobile/Desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              applyFilters('');
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              !selectedCategory
                ? 'bg-forest-700 text-white shadow-sm ring-2 ring-forest-600/30'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <span>🌱</span>
            <span>All Produce</span>
          </button>

          {categories?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const nextSlug = selectedCategory === cat.slug ? '' : cat.slug;
                setSelectedCategory(nextSlug);
                applyFilters(nextSlug);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.slug
                  ? 'bg-forest-700 text-white shadow-sm ring-2 ring-forest-600/30'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <span>{getCategoryIcon(cat.slug)}</span>
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.slug ? 'bg-forest-800 text-forest-100' : 'bg-stone-200 text-stone-500'
                }`}
              >
                {cat.product_count}
              </span>
            </button>
          ))}
        </div>

        {/* Secondary Filter Bar: Price Range Pills, Organic Toggle, and Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          {/* Price Range Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Price:
            </span>
            <button
              type="button"
              onClick={() => handleSelectPricePreset('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                currentPricePreset === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Prices
            </button>
            <button
              type="button"
              onClick={() => handleSelectPricePreset('under-2')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                currentPricePreset === 'under-2'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Under $2
            </button>
            <button
              type="button"
              onClick={() => handleSelectPricePreset('2-5')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                currentPricePreset === '2-5'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              $2 - $5
            </button>
            <button
              type="button"
              onClick={() => handleSelectPricePreset('over-5')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                currentPricePreset === 'over-5'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              $5+
            </button>

            {/* Organic Pill Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextOrg = !isOrganic;
                setIsOrganic(nextOrg);
                applyFilters(undefined, nextOrg);
              }}
              className={`ml-1 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                isOrganic
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Leaf className="w-3 h-3" />
              <span>Organic</span>
            </button>
          </div>

          {/* Sort Dropdown & Reset Action */}
          <div className="flex items-center gap-3 ml-auto">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-stone-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <select
                value={ordering}
                onChange={(e) => {
                  setOrdering(e.target.value);
                  applyFilters(undefined, undefined, undefined, e.target.value);
                }}
                className="bg-transparent text-xs text-stone-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="-created_at">Newest Harvest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-rating_avg">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Content: Desktop Sidebar & Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Filters (Desktop Sticky) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-forest-700" />
                Filter Options
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Farm Origin Province */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-forest-600" />
                Origin Province
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  applyFilters(undefined, undefined, e.target.value);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-forest-600 font-medium transition-colors"
              >
                <option value="">All Provinces in Cambodia</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter Inputs */}
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-forest-600" />
                Custom Price Range ($)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  step="0.5"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => applyFilters(undefined, undefined, undefined, undefined, minPrice, maxPrice)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-900 font-medium focus:outline-none focus:border-forest-600"
                />
                <span className="text-stone-400 text-xs font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  step="0.5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={() => applyFilters(undefined, undefined, undefined, undefined, minPrice, maxPrice)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-900 font-medium focus:outline-none focus:border-forest-600"
                />
              </div>
            </div>

            {/* Organic Checkbox */}
            <div className="pt-4 border-t border-stone-100">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOrganic}
                  onChange={(e) => {
                    setIsOrganic(e.target.checked);
                    applyFilters(undefined, e.target.checked);
                  }}
                  className="w-4 h-4 text-forest-600 rounded border-stone-300 focus:ring-forest-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-800">Certified Organic Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* 1. UPGRADED PRODUCT GRID: 2 COLS MOBILE, 3-4 COLS DESKTOP */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Items Counter */}
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
            <span>
              Showing <strong className="text-stone-900 font-bold">{productsData?.results.length || 0}</strong> of{' '}
              <strong className="text-stone-900 font-bold">{productsData?.count || 0}</strong> harvest items
            </span>
          </div>

          {/* Product Grid / Skeleton / Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : productsData?.results.length === 0 ? (
            <EmptyState
              title="No produce matches your filters"
              description="Try adjusting your category, price filters, or search terms to discover other farm goods."
              actionLabel="Reset Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-6">
              {productsData?.results.map((product, idx) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} priority={idx < 4 ? 'high' : 'auto'} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Pagination Controls */}
          {productsData && productsData.total_pages > 1 && (
            <div className="pt-8 flex items-center justify-center gap-2">
              {Array.from({ length: productsData.total_pages }).map((_, i) => {
                const pNum = i + 1;
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('page', pNum.toString());
                      setSearchParams(params);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-2xl text-xs font-bold transition-all ${
                      pageParam === pNum
                        ? 'bg-forest-600 text-white shadow-sm'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. MOBILE FILTER BOTTOM-SHEET MODAL / DRAWER */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Bottom Sheet Modal Container */}
            <div className="fixed inset-x-0 bottom-0 max-h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-2xl overflow-hidden">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Drag Handle & Header */}
                <div className="pt-3 pb-3 px-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-forest-700" />
                    <h2 className="text-base font-bold text-stone-900 font-display">Filter Produce</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter Controls Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
                  {/* Categories */}
                  <div>
                    <span className="block font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2.5">
                      Category
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('')}
                        className={`p-2.5 rounded-xl font-bold text-left transition-all ${
                          !selectedCategory
                            ? 'bg-forest-600 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        All Produce
                      </button>
                      {categories?.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`p-2.5 rounded-xl font-bold text-left truncate transition-all ${
                            selectedCategory === cat.slug
                              ? 'bg-forest-600 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {getCategoryIcon(cat.slug)} {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <span className="block font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2.5">
                      Price Range
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {['all', 'under-2', '2-5', 'over-5'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (preset === 'all') {
                              setMinPrice('');
                              setMaxPrice('');
                            } else if (preset === 'under-2') {
                              setMinPrice('');
                              setMaxPrice('2');
                            } else if (preset === '2-5') {
                              setMinPrice('2');
                              setMaxPrice('5');
                            } else if (preset === 'over-5') {
                              setMinPrice('5');
                              setMaxPrice('');
                            }
                          }}
                          className={`py-2 px-1 text-center rounded-xl font-semibold capitalize text-[11px] ${
                            currentPricePreset === preset
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {preset === 'all'
                            ? 'All'
                            : preset === 'under-2'
                            ? '< $2'
                            : preset === '2-5'
                            ? '$2 - $5'
                            : '$5+'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min ($)"
                        min="0"
                        step="0.5"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                      />
                      <span className="text-stone-400 font-bold">-</span>
                      <input
                        type="number"
                        placeholder="Max ($)"
                        min="0"
                        step="0.5"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Origin Province */}
                  <div>
                    <span className="block font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2">
                      Origin Province
                    </span>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-800"
                    >
                      <option value="">All Provinces in Cambodia</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Certified Organic Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer">
                      <span className="font-bold text-stone-800 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        Certified Organic Only
                      </span>
                      <input
                        type="checkbox"
                        checked={isOrganic}
                        onChange={(e) => setIsOrganic(e.target.checked)}
                        className="w-5 h-5 text-forest-600 rounded border-stone-300 focus:ring-forest-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Bottom Sheet Actions */}
                <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex-1 py-3 px-4 rounded-2xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition-colors text-center"
                  >
                    Reset All
                  </button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => applyFilters()}
                    className="flex-2 py-3 rounded-2xl font-black text-center"
                  >
                    Show Results
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
