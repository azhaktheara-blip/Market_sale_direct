import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Phone } from 'lucide-react';
import { analyticsApi } from '../../api';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const FarmerCustomersPage: React.FC = () => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['farmer-customers'],
    queryFn: () => analyticsApi.getFarmerCustomers().then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Customer Directory</h1>
        <p className="text-xs text-stone-500 mt-0.5">Direct buyers, restaurants, and businesses who order from your farm.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : customers?.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No customers yet"
          description="Your buyer list will populate automatically as customers place orders."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Orders Placed</th>
                  <th className="p-4 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {customers?.map((cust) => (
                  <tr key={cust.customer__id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 font-bold flex items-center justify-center text-xs">
                          {cust.customer__username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-stone-900">{cust.customer__username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-stone-500 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-stone-400" />
                        <span>{cust.customer__email}</span>
                      </div>
                      {cust.customer__phone_number && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{cust.customer__phone_number}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-xl">
                        {cust.order_count} order(s)
                      </span>
                    </td>
                    <td className="p-4 text-right font-extrabold text-stone-900 text-sm">
                      ${parseFloat(cust.total_spent).toFixed(2)}
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

