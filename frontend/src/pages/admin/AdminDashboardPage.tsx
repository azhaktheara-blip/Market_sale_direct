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
  CreditCard,
  ExternalLink,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { analyticsApi, paymentsApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import type { PaymentTransaction } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsApi.getAdminAnalytics().then((res) => res.data),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => paymentsApi.getTransactions().then((res) => res.data),
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

  const txList: PaymentTransaction[] = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as any)?.results || [];

  return (
    <div className="space-y-8">
      {/* Amazon / Alibaba Style Executive Command Hero */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-forest-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-700/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Enterprise Operations Command
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active KHQR Escrow
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              FarmerDirect Marketplace Central
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Real-time platform governance, automated 5% commission retention, direct producer bank settlements, and crop fulfillment intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="https://farmer-direct-backend.onrender.com/farmer-direct-saleadmin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Django Admin Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              to="/admin/farmers"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Growers</span>
            </Link>

            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
            </Link>
          </div>
        </div>
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

      {/* Commission & Direct Bank KHQR Transactions Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-forest-700" />
              <span>Real-Time Commission & KHQR Transactions</span>
            </h3>
            <p className="text-xs text-stone-500">
              Automatic 5% platform fee deduction audit log and direct grower bank disbursements.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            {txList.length} Settled Record(s)
          </span>
        </div>

        {txList.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No transactions recorded yet. Completed orders will appear here automatically with commission breakdown.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Producer / Farm</th>
                  <th className="py-2.5 px-3 text-right">Gross Total</th>
                  <th className="py-2.5 px-3 text-right text-indigo-700 font-bold">Platform Fee (5%)</th>
                  <th className="py-2.5 px-3 text-right text-forest-800 font-bold">Net Payout (95%)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {txList.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-stone-800">
                      {tx.transaction_id}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      #{tx.order_number}
                    </td>
                    <td className="py-3 px-3">
                      <span className="block text-stone-900 font-semibold">{tx.customer_email}</span>
                      <span className="text-[10px] font-mono text-stone-400">{tx.customer_account_id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="block text-stone-900 font-semibold">{tx.farmer_farm_name}</span>
                      <span className="text-[10px] font-mono text-stone-400">{tx.farmer_account_id}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-stone-900">
                      ${parseFloat(String(tx.gross_amount)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-700">
                      +${parseFloat(String(tx.platform_commission)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-forest-800 font-mono">
                      ${parseFloat(String(tx.farmer_net_payout)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

