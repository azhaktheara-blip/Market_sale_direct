import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, ArrowUpDown, X, Filter, Sparkles, ChevronDown } from 'lucide-react';
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
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [isOrganic, setIsOrganic] = useState(organicParam);
  const [selectedProvince, setSelectedProvince] = useState(provinceParam);
  const [ordering, setOrdering] = useState(orderingParam);

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
    queryKey: ['products', { category: selectedCategory, search: searchParam, is_organic: isOrganic, province: selectedProvince, ordering, page: pageParam }],
    queryFn: () =>
      productsApi
        .getProducts({
          category: selectedCategory || undefined,
          search: searchParam || undefined,
          is_organic: isOrganic ? true : undefined,
          province: selectedProvince || undefined,
          ordering: ordering || undefined,
          page: pageParam,
          page_size: 12,
        })
        .then((res) => res.data),
  });

  // Sync internal state to URL query params
  const applyFilters = (newCategory?: string, newOrganic?: boolean, newProvince?: string, newOrdering?: string) => {
    const params = new URLSearchParams();
    const cat = newCategory !== undefined ? newCategory : selectedCategory;
    const org = newOrganic !== undefined ? newOrganic : isOrganic;
    const prov = newProvince !== undefined ? newProvince : selectedProvince;
    const ord = newOrdering !== undefined ? newOrdering : ordering;

    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (cat) params.set('category', cat);
    if (org) params.set('is_organic', 'true');
    if (prov) params.set('province', prov);
    if (ord) params.set('ordering', ord);
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
    setSearchParams(new URLSearchParams());
  };

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
            Fresh Produce Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Discover <strong className="text-stone-800 font-bold"><AnimatedCount value={productsData?.count || 0} /></strong> farm-direct crops harvested by verified local growers.
          </p>
        </div>

        {/* Search Bar & Mobile Filter Trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search produce, farm, province..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 focus:border-forest-600 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-100 shadow-2xs font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2.5 bg-white border border-stone-300 rounded-2xl text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters (Desktop Sticky) */}
        <div className="hidden lg:block">
          <div className="sticky top-24 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-forest-700" />
                Produce Filters
              </span>
              {(selectedCategory || isOrganic || selectedProvince || searchParam) && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
                Category
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    applyFilters('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    !selectedCategory
                      ? 'bg-forest-600 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      applyFilters(cat.slug);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-forest-600 text-white shadow-xs font-bold'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className={`text-[10px] font-mono ${selectedCategory === cat.slug ? 'text-forest-100' : 'text-stone-400'}`}>
                      {cat.product_count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Organic Toggle */}
            <div className="pt-4 border-t border-stone-100">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOrganic}
                  onChange={(e) => {
                    setIsOrganic(e.target.checked);
                    applyFilters(undefined, e.target.checked);
                  }}
                  className="w-4 h-4 text-forest-600 rounded border-stone-300 focus:ring-forest-500"
                />
                <span className="text-xs font-bold text-stone-800">Certified Organic Only</span>
              </label>
            </div>

            {/* Farm Province Filter */}
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Origin Province
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  applyFilters(undefined, undefined, e.target.value);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-forest-600 font-medium"
              >
                <option value="">All Provinces in Cambodia</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting Top Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200/80 shadow-xs text-xs">
            <span className="text-stone-500 font-medium">
              Showing <strong className="text-stone-900 font-bold">{productsData?.results.length || 0}</strong> of{' '}
              <strong className="text-stone-900 font-bold">{productsData?.count || 0}</strong> items
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-500 hidden sm:inline font-medium">Sort:</span>
              <select
                value={ordering}
                onChange={(e) => {
                  setOrdering(e.target.value);
                  applyFilters(undefined, undefined, undefined, e.target.value);
                }}
                className="bg-stone-50 border border-stone-300 rounded-xl py-1.5 px-3 text-xs text-stone-800 focus:outline-none font-bold"
              >
                <option value="-created_at">Newest Harvest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-rating_avg">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : productsData?.results.length === 0 ? (
            <EmptyState
              title="No produce matches your filters"
              description="Try adjusting your category, price filters, or search terms to discover other farm goods."
              actionLabel="Clear Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {productsData?.results.map((product, idx) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} priority={idx < 3 ? 'high' : 'auto'} />
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
    </PageTransition>
  );
};
