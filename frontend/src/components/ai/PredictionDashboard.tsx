import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  DollarSign,
  Compass,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { fastapiAiApi } from '../../api/fastapiAi';
import { PredictionsResponse, CropRecommendation, WeatherAlert } from '../../types/ai';

interface PredictionDashboardProps {
  className?: string;
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  className = '',
}) => {
  const [predictions, setPredictions] = useState<PredictionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchPredictionsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fastapiAiApi.getPredictions();
      setPredictions(data);
    } catch (err: any) {
      console.error('Fetch predictions error:', err);
      setError(err.message || 'Failed to fetch harvest predictions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictionsData();
  }, []);

  const getActionBadge = (action: CropRecommendation['action']) => {
    switch (action) {
      case 'HARVEST_NOW':
        return {
          label: 'Harvest Now',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'PLANT_NOW':
        return {
          label: 'Plant Resilient Crop',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        };
      case 'PROTECT_COVER':
        return {
          label: 'Cover / Protect',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'DELAY_HARVEST':
        return {
          label: 'Delay Planting',
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      default:
        return {
          label: action,
          bg: 'bg-stone-100 text-stone-700 border-stone-300',
        };
    }
  };

  const filteredCrops = predictions?.crop_recommendations.filter((c) => {
    if (filterAction === 'ALL') return true;
    return c.action === filterAction;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* SaaS Executive Header Card */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-700/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Agri-Forecast & Harvest Intelligence
              </span>
              {predictions && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300 text-[10px] font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(predictions.timestamp).toLocaleDateString()}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              AI Predictive Harvest Dashboard
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Real-time agro-meteorological forecasting correlating monsoon rainfall patterns, soil moisture indices, and commodity market price trajectories across Cambodia.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={fetchPredictionsData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Forecast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-soft flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-stone-600">
            Synthesizing satellite weather maps and wholesale produce price trends...
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && !isLoading && (
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPredictionsData}
            className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Predictions Content */}
      {predictions && !isLoading && (
        <div className="space-y-6">
          {/* Weather Alerts Banner Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.weather_alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-5 sm:p-6 border shadow-sm flex flex-col justify-between ${
                  alert.level === 'WARNING'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                    : 'bg-amber-50/60 border-amber-200 text-amber-950'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        alert.level === 'WARNING'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-stone-950'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5" />
                      {alert.level}: Precipitation Alert
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold font-display">
                    {alert.title}
                  </h3>
                  <p className="text-xs leading-relaxed opacity-90">
                    {alert.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <span className="opacity-70">Impact Zones:</span>
                  {alert.affected_regions.map((region, rIdx) => (
                    <span
                      key={rIdx}
                      className="px-2 py-0.5 rounded-md bg-white/70 border border-black/5 font-mono text-[10px]"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Soil & Market Advisory Strip */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                Soil Drainage & Agronomy Advisory
              </span>
              <p className="text-xs text-stone-700 font-medium leading-relaxed max-w-3xl">
                {predictions.soil_advisory}
              </p>
            </div>

            <div className="shrink-0 bg-white px-4 py-2 rounded-2xl border border-emerald-200 shadow-sm text-right">
              <span className="text-[10px] font-bold text-stone-400 block uppercase">
                Active Season
              </span>
              <span className="text-xs font-extrabold text-stone-900">
                {predictions.active_season}
              </span>
            </div>
          </div>

          {/* Crop Recommendations Header & Filter Pills */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900 font-display flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-forest-700" />
                  <span>AI Crop Harvest & Planting Recommendations</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Tactical guidance recommending resilient root vegetables and optimal harvest timing based on rainfall impact.
                </p>
              </div>

              {/* Action Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'HARVEST_NOW', 'PLANT_NOW', 'PROTECT_COVER', 'DELAY_HARVEST'].map((actionKey) => (
                  <button
                    key={actionKey}
                    type="button"
                    onClick={() => setFilterAction(actionKey)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      filterAction === actionKey
                        ? 'bg-forest-800 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {actionKey === 'ALL'
                      ? 'All'
                      : actionKey.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCrops?.map((crop, index) => {
                const actionBadge = getActionBadge(crop.action);

                return (
                  <div
                    key={index}
                    className="bg-stone-50/60 rounded-2xl p-5 border border-stone-200/80 hover:border-emerald-300 hover:bg-white transition-all shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {crop.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${actionBadge.bg}`}
                        >
                          {actionBadge.label}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-stone-900 font-display">
                        {crop.crop}
                      </h4>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {crop.reasoning}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Optimal Window:</span>
                        <span className="font-bold text-stone-800 font-mono text-[11px]">
                          {crop.optimal_window}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Price Outlook:</span>
                        <span className="font-extrabold text-emerald-700 font-mono text-[11px]">
                          {crop.price_outlook_usd}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Market Demand:</span>
                        <span
                          className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-md ${
                            crop.demand_level === 'HIGH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {crop.demand_level} Demand
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Market Summary */}
            <div className="mt-4 p-4 rounded-2xl bg-stone-100 text-stone-700 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest-700 shrink-0" />
              <span>
                <strong>Macro Economy Outlook:</strong> {predictions.market_summary}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionDashboard;

