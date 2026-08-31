import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  CloudRain,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api';
import { Button } from '../../components/common/Button';
import { PageTransition } from '../../components/motion/PageTransition';
import { useLanguage } from '../../context/LanguageContext';

export const MarketRadarPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedProvince, setSelectedProvince] = useState('Siem Reap');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const provinces = [
    'Siem Reap',
    'Battambang',
    'Kampot',
    'Kandal',
    'Pursat',
    'Mondulkiri',
    'Takeo',
    'Kampong Cham',
    'Phnom Penh',
  ];

  // Weather Query
  const { data: weatherData, isLoading: isWeatherLoading } = useQuery({
    queryKey: ['agri-weather-public', selectedProvince],
    queryFn: () => aiApi.getAgriWeather(selectedProvince).then((res) => res.data),
  });

  // Market Prices Query
  const { data: marketData, isLoading: isMarketLoading } = useQuery({
    queryKey: ['market-prices-public', selectedCategory, selectedProvince],
    queryFn: () =>
      aiApi
        .getMarketPrices({
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          province: selectedProvince,
        })
        .then((res) => res.data),
  });

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-stone-900 text-white rounded-3xl p-8 sm:p-12 shadow-soft-lg space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
          <Sparkles className="w-3.5 h-3.5" />
          100% Transparent Food System
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white">
          {t('ai.suite_title')}
        </h1>
        <p className="text-sm sm:text-base text-stone-300 max-w-2xl leading-relaxed">
          {t('ai.suite_sub')}
        </p>
      </div>

      {/* Weather Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-stone-900 font-display flex items-center gap-2">
              <CloudRain className="w-6 h-6 text-forest-600" />
              {t('ai.weather_title')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {t('ai.weather_sub')}
            </p>
          </div>

          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-forest-600 shadow-2xs"
          >
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov} Province
              </option>
            ))}
          </select>
        </div>

        {weatherData?.current_day && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-forest-50 rounded-3xl p-6 border border-forest-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-forest-700 uppercase tracking-wider block">
                  Current Condition
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  {weatherData.current_day.condition_label}
                </h3>
                <span className="text-xs text-stone-500">
                  High: {weatherData.current_day.temp_high}°C • Low: {weatherData.current_day.temp_low}°C
                </span>
              </div>
              <span className="text-5xl">{weatherData.current_day.icon}</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  {t('ai.precipitation')}
                </span>
                <h3 className="text-2xl font-black text-stone-900 mt-1">
                  {weatherData.current_day.rain_probability}%
                </h3>
                <span className="text-xs text-stone-500">
                  Volume: {weatherData.current_day.rain_amount_mm} mm
                </span>
              </div>
              <CloudRain className="w-10 h-10 text-sky-500 stroke-[1.5]" />
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  {t('ai.soil_moisture')}
                </span>
                <h3 className="text-2xl font-black text-emerald-700 mt-1">
                  {weatherData.current_day.soil_moisture}
                </h3>
                <span className="text-xs text-stone-500">
                  {t('ai.humidity')}: {weatherData.current_day.humidity_percent}%
                </span>
              </div>
              <ShieldCheck className="w-10 h-10 text-emerald-600 stroke-[1.5]" />
            </div>
          </div>
        )}
      </div>

      {/* Market Prices Table */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-stone-900 font-display flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-forest-600" />
              {t('ai.price_board_title')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {t('ai.price_board_sub')}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'Fresh Vegetables', 'Tropical Fruits', 'Herbs & Spices', 'Grains & Rice'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-forest-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="py-4 px-5">Produce Commodity</th>
                  <th className="py-4 px-3">Phnom Penh</th>
                  <th className="py-4 px-3">Siem Reap</th>
                  <th className="py-4 px-3">Battambang</th>
                  <th className="py-4 px-3">Kampot</th>
                  <th className="py-4 px-3">Kandal</th>
                  <th className="py-4 px-3">Mondulkiri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {marketData?.commodities.map((item) => (
                  <tr key={item.commodity} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <strong className="font-extrabold text-stone-900 text-sm block">
                        {item.commodity}
                      </strong>
                      <span className="text-[11px] text-stone-400">{item.category}</span>
                    </td>

                    {['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampot', 'Kandal', 'Mondulkiri'].map(
                      (prov) => {
                        const pData = item.prices[prov];
                        if (!pData) return <td key={prov} className="py-3 px-3">-</td>;

                        const isUp = pData.change_7d > 0;
                        const isDown = pData.change_7d < 0;

                        return (
                          <td key={prov} className="py-4 px-3">
                            <div className="flex items-baseline gap-1">
                              <span className="font-black text-stone-900 text-sm">
                                ${pData.price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-stone-400 lowercase">
                                /{item.unit}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mt-0.5">
                              {isUp ? (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center">
                                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                  +{pData.change_7d}%
                                </span>
                              ) : isDown ? (
                                <span className="text-[10px] font-bold text-rose-600 flex items-center">
                                  <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                                  {pData.change_7d}%
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-bold">
                                  0.0%
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

