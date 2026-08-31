import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  Package,
  ShoppingBag,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminDashboardPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsApi.getAdminAnalytics().then((res) => res.data),
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
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">
          Platform Administration & GMV Analytics
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Overview of platform-wide marketplace volume, commissions, verified growers, and order operations.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Gross Merchandise Volume</span>
            <div className="p-2 rounded-xl bg-forest-50 text-forest-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-stone-900">${metrics?.total_gmv || '0.00'}</p>
          <span className="text-[11px] text-stone-400 block">${metrics?.monthly_gmv || '0.00'} in last 30 days</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Platform Commission (5%)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-700">${metrics?.total_commission || '0.00'}</p>
          <span className="text-[11px] text-stone-400 block">{metrics?.total_orders || 0} completed orders</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Registered Farmers</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-700">{metrics?.total_farmers || 0}</p>
          <span className="text-[11px] text-stone-400 block">{metrics?.verified_farmers || 0} verified farms</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Pending Verifications</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{metrics?.pending_verifications || 0}</p>
          <Link to="/admin/farmers?verification_status=PENDING" className="text-[11px] text-amber-700 font-semibold hover:underline block">
            Review applications →
          </Link>
        </div>
      </div>

      {/* Grid: Top Performing Farms & Recent Platform Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Performing Farms */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Top Performing Producers
            </h3>
            <Link to="/admin/farmers" className="text-xs font-bold text-forest-700 hover:underline">
              All Farms
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {analytics?.top_farmers.map((farm) => (
              <div key={farm.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <span>{farm.farm_name}</span>
                    {farm.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <span className="text-stone-400">{farm.province} • {farm.total_orders} orders</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-stone-900 text-sm block">${parseFloat(farm.total_revenue).toFixed(2)}</span>
                  <span className="text-[10px] text-stone-400">{farm.rating_avg.toFixed(1)} ★</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Recent Marketplace Orders
            </h3>
            <Link to="/admin/orders" className="text-xs font-bold text-forest-700 hover:underline">
              All Orders
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {analytics?.recent_orders.map((ord) => (
              <div key={ord.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-stone-900">#{ord.order_number}</span>
                    <Badge statusValue={ord.status} size="sm" />
                  </div>
                  <span className="text-stone-500">{ord.farmer.farm_name} → {ord.customer_name || ord.customer_email}</span>
                </div>
                <div className="text-right font-extrabold text-stone-900 text-sm">
                  ${parseFloat(ord.total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

