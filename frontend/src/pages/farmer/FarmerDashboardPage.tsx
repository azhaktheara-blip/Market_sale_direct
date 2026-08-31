import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Package,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Sprout,
  Calendar,
} from 'lucide-react';
import { analyticsApi, aiApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { PageTransition } from '../../components/motion/PageTransition';
import { AnimatedCount } from '../../components/motion/AnimatedCount';

export const FarmerDashboardPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['farmer-analytics'],
    queryFn: () => analyticsApi.getFarmerAnalytics().then((res) => res.data),
  });

  const { data: forecastData } = useQuery({
    queryKey: ['ai-harvest-forecast'],
    queryFn: () => aiApi.getHarvestForecast().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics;

  return (
    <PageTransition className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 font-display">Farmer Dashboard</h1>
          <p className="text-xs text-stone-500 mt-0.5">Real-time sales, live harvest inventory, and order fulfillment status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/farmer/products/new">
            <Button variant="primary" size="sm" leftIcon={<Package className="w-3.5 h-3.5" />} className="font-bold">
              Add New Produce
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Sales Revenue</span>
            <div className="p-2 rounded-xl bg-forest-50 text-forest-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 font-display">
            $<AnimatedCount value={parseFloat(metrics?.total_revenue || '0.00')} decimals={2} />
          </p>
          <span className="text-[11px] text-stone-400 block">${metrics?.monthly_revenue || '0.00'} in last 30 days</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 font-display">{metrics?.pending_orders || 0}</p>
          <Link to="/farmer/orders?status=PENDING" className="text-[11px] text-amber-700 hover:underline font-bold block">
            Needs confirmation →
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Listings</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 font-display">{metrics?.active_products || 0}</p>
          <span className="text-[11px] text-stone-400 block">{metrics?.rating_avg || '0.00'} ★ ({metrics?.rating_count || 0} reviews)</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Low Stock Warnings</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 font-display">{metrics?.low_stock_products || 0}</p>
          <Link to="/farmer/inventory" className="text-[11px] text-rose-600 hover:underline font-bold block">
            Update inventory →
          </Link>
        </div>
      </div>

      {/* AI Harvest Demand Forecasting Widget */}
      {forecastData?.forecast && forecastData.forecast.length > 0 && (
        <div className="bg-gradient-to-br from-forest-900 via-forest-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-5 border border-forest-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-forest-700/60 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700/80 text-emerald-300 text-[11px] font-bold uppercase tracking-wider shadow-xs mb-1">
                <Sparkles className="w-3 h-3" />
                AI Crop Forecasting Engine
              </div>
              <h3 className="text-xl font-bold font-display">Upcoming 7-Day Harvest Demand Trends</h3>
            </div>
            <span className="text-xs text-forest-200 font-medium">
              Based on active customer subscriptions & daily order velocities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecastData.forecast.slice(0, 3).map((fc) => (
              <div
                key={fc.product_id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white truncate">{fc.product_name}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30">
                    {fc.projected_growth_percentage}
                  </span>
                </div>
                <div className="text-xs text-stone-300 flex items-center justify-between">
                  <span>Current Stock: <strong>{fc.current_stock} {fc.unit}</strong></span>
                  <span>Projected Demand: <strong className="text-emerald-300">{fc.projected_weekly_demand}</strong></span>
                </div>
                <p className="text-[11px] text-emerald-200/90 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20 leading-relaxed">
                  💡 {fc.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Top Selling Produce & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Selling Products */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-600" />
              Top Selling Produce
            </h3>
          </div>

          {analytics?.top_products.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">No completed sales recorded yet.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {analytics?.top_products.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-stone-900">{item.product_name_snapshot}</h4>
                    <span className="text-stone-400 font-medium">{item.total_sold} {item.unit_snapshot} sold</span>
                  </div>
                  <span className="font-extrabold text-forest-700">${parseFloat(item.total_sales).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Incoming Orders */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-forest-600" />
              Recent Orders
            </h3>
            <Link to="/farmer/orders" className="text-xs font-bold text-forest-700 hover:underline">
              View All
            </Link>
          </div>

          {analytics?.recent_orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">No incoming orders yet.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {analytics?.recent_orders.map((ord) => (
                <div key={ord.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-stone-900">#{ord.order_number}</span>
                      <Badge statusValue={ord.status} size="sm" />
                    </div>
                    <span className="text-stone-500">{ord.customer_name || ord.customer_email} • {ord.items.length} items</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-900 block">${parseFloat(ord.total).toFixed(2)}</span>
                    <Link to={`/farmer/orders/${ord.id}`} className="text-forest-700 font-bold hover:underline text-[11px]">
                      Fulfill →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};
