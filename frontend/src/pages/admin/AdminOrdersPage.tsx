import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminOrdersPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => ordersApi.getAdminOrders({ status: statusFilter || undefined }).then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Marketplace Order Oversight</h1>
        <p className="text-xs text-stone-500 mt-0.5">Platform-wide order lifecycle, payment statuses, and commission settlements.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Farm</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Commission</th>
                  <th className="p-4 text-right">Total GMV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {ordersData?.results.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-stone-900">#{ord.order_number}</td>
                    <td className="p-4 font-bold text-stone-900">{ord.farmer.farm_name}</td>
                    <td className="p-4 text-stone-500">{ord.customer_name || ord.customer_email}</td>
                    <td className="p-4">
                      <Badge statusValue={ord.status} size="sm" />
                    </td>
                    <td className="p-4 font-semibold text-indigo-700">
                      ${parseFloat(ord.marketplace_commission).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-stone-900 text-sm">
                      ${parseFloat(ord.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

