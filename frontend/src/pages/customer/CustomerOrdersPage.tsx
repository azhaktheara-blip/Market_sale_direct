import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { ordersApi } from '../../api';
import { OrderCard } from '../../components/cards/OrderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';

export const CustomerOrdersPage: React.FC = () => {
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const newOrderSuccess = (location.state as { newOrderSuccess?: boolean })?.newOrderSuccess;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['customer-orders', statusFilter],
    queryFn: () => ordersApi.getCustomerOrders({ status: statusFilter || undefined }).then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">My Orders</h1>
        <p className="text-xs text-stone-500 mt-0.5">Track real-time harvest and delivery progress directly from farms.</p>
      </div>

      {newOrderSuccess && (
        <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 text-forest-900 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0" />
          <div>
            <strong className="block font-bold">Your order was placed successfully!</strong>
            <span>The growers have been notified and will prepare your fresh harvest.</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'All Orders', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Harvesting / In Progress', value: 'PREPARING' },
          { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setStatusFilter(chip.value)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              statusFilter === chip.value
                ? 'bg-forest-600 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : ordersData?.results.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="No orders found"
          description="You haven't placed any orders matching this status yet."
        />
      ) : (
        <div className="space-y-4">
          {ordersData?.results.map((order) => (
            <OrderCard key={order.id} order={order} portal="customer" />
          ))}
        </div>
      )}
    </div>
  );
};

