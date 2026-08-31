import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Sun, CloudRain, Sparkles, ArrowRight, Sprout } from 'lucide-react';
import { productsApi } from '../../api';
import { Skeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

export const SeasonalCalendarPage: React.FC = () => {
  const currentMonthIndex = new Date().getMonth() + 1; // 1..12
  const [activeMonth, setActiveMonth] = useState<number>(currentMonthIndex);

  const { data: calendar, isLoading } = useQuery({
    queryKey: ['seasonal-calendar'],
    queryFn: () => productsApi.getSeasonalCalendar().then((res) => res.data),
  });

  const selectedMonthData = calendar?.find((m) => m.month === activeMonth) || calendar?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5" />
          <span>Cambodian Agricultural Cycle</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          Seasonal Harvest Calendar
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Eat fresh, support biodiversity, and save money by purchasing fruits and vegetables during their natural peak harvest season in Cambodia.
        </p>
      </div>

      {/* Month Selector Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 bg-stone-100 p-2 rounded-3xl">
        {calendar?.map((m) => {
          const isSelected = activeMonth === m.month;
          const isCurrent = currentMonthIndex === m.month;

          return (
            <button
              key={m.month}
              onClick={() => setActiveMonth(m.month)}
              className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-forest-700 text-white shadow-soft scale-105 ring-2 ring-forest-600'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                {m.name.slice(0, 3)}
              </span>
              <span className="text-sm font-extrabold mt-0.5">#{m.month}</span>
              {isCurrent && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 ${
                  isSelected ? 'bg-amber-400 text-stone-900' : 'bg-forest-100 text-forest-800'
                }`}>
                  Now
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading || !selectedMonthData ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Active Month Showcase Banner */}
          <div className="bg-gradient-to-r from-forest-800 via-forest-900 to-stone-900 rounded-3xl p-8 text-white shadow-soft relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 z-10 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {selectedMonthData.season.includes('Wet') ? <CloudRain className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {selectedMonthData.season}
                </span>
                {currentMonthIndex === selectedMonthData.month && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-400 text-stone-900 text-xs font-extrabold">
                    Current Season
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
                {selectedMonthData.name} Peak Harvest
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {selectedMonthData.focus}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center z-10 shrink-0">
              <div className="text-3xl font-black text-emerald-400">{selectedMonthData.total_crops}</div>
              <div className="text-xs font-bold text-stone-200 mt-0.5">Peak Season Crops</div>
              <Link to="/products" className="inline-block mt-3">
                <Button variant="secondary" size="sm" className="bg-white text-stone-900 text-xs font-bold hover:bg-stone-100">
                  Shop All Produce
                </Button>
              </Link>
            </div>
          </div>

          {/* Featured Produce in this Month */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-forest-600" />
                <span>Featured Harvests for {selectedMonthData.name}</span>
              </h3>
            </div>

            {selectedMonthData.featured_products.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl text-xs text-stone-500">
                All seasonal crops for this month are currently in cultivation. Check back soon for early harvest batches!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedMonthData.featured_products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="w-full h-40 rounded-2xl bg-stone-100 overflow-hidden mb-3">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🌱</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-full">
                          {p.farmer.farm_name}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">{p.farmer.province}</span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{p.short_description}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-base font-extrabold text-stone-900">
                        ${parseFloat(p.price).toFixed(2)} <span className="text-xs font-normal text-stone-400">/{p.unit}</span>
                      </div>
                      <Link to={`/products/${p.slug}`}>
                        <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Order
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

