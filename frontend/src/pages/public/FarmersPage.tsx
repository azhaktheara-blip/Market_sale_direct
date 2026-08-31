import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck, MapPin, SlidersHorizontal, Filter } from 'lucide-react';
import { farmersApi } from '../../api';
import { FarmerCard } from '../../components/cards/FarmerCard';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const FarmersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const provinceParam = searchParams.get('province') || '';
  const practiceParam = searchParams.get('farming_practice') || '';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedProvince, setSelectedProvince] = useState(provinceParam);
  const [selectedPractice, setSelectedPractice] = useState(practiceParam);

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
  ];

  const practices = [
    { value: 'ORGANIC', label: 'Certified Organic' },
    { value: 'REGENERATIVE', label: 'Regenerative Agriculture' },
    { value: 'HYDROPONIC', label: 'Hydroponic Greenhouse' },
    { value: 'PERMACULTURE', label: 'Permaculture' },
    { value: 'CONVENTIONAL', label: 'Sustainable Conventional' },
  ];

  const { data: farmersData, isLoading } = useQuery({
    queryKey: ['farmers-list', { search: searchParam, province: selectedProvince, practice: selectedPractice }],
    queryFn: () =>
      farmersApi
        .getFarmers({
          search: searchParam || undefined,
          province: selectedProvince || undefined,
          farming_practice: selectedPractice || undefined,
          page_size: 20,
        })
        .then((res) => res.data),
  });

  const applyFilters = (newProvince?: string, newPractice?: string) => {
    const params = new URLSearchParams();
    const prov = newProvince !== undefined ? newProvince : selectedProvince;
    const prac = newPractice !== undefined ? newPractice : selectedPractice;

    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (prov) params.set('province', prov);
    if (prac) params.set('farming_practice', prac);

    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProvince('');
    setSelectedPractice('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Transparent Farm Direct</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          Meet Our Local Agricultural Producers
        </h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          Connect directly with family-run organic farms and sustainable estates across the provinces of Cambodia.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="Search farm by name, bio, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          <div className="sm:col-span-3">
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                applyFilters(e.target.value, undefined);
              }}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600 font-medium"
            >
              <option value="">All Provinces</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedPractice}
              onChange={(e) => {
                setSelectedPractice(e.target.value);
                applyFilters(undefined, e.target.value);
              }}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600 font-medium"
            >
              <option value="">All Farming Practices</option>
              {practices.map((prac) => (
                <option key={prac.value} value={prac.value}>
                  {prac.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Farmers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-3xl" />
          ))}
        </div>
      ) : farmersData?.results.length === 0 ? (
        <EmptyState
          title="No farms found"
          description="Try clearing your search query or selecting another province to discover other growers."
          actionLabel="Reset Search"
          onAction={clearAllFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmersData?.results.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} />
          ))}
        </div>
      )}
    </div>
  );
};

