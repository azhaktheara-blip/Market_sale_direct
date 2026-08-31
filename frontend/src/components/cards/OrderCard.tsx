import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ChevronRight, MapPin, Truck } from 'lucide-react';
import { Order } from '../../types';
import { Badge } from '../common/Badge';

interface OrderCardProps {
  order: Order;
  portal?: 'customer' | 'farmer' | 'admin';
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, portal = 'customer' }) => {
  const detailUrl = portal === 'farmer' ? `/farmer/orders/${order.id}` : `/customer/orders/${order.id}`;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-soft hover:shadow-soft-lg transition-all p-5 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-stone-100">
        <div>
          <span className="text-xs font-mono font-bold text-stone-900 mr-2">
            #{order.order_number}
          </span>
          <span className="text-xs text-stone-400">
            {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <Badge statusValue={order.status} size="sm" />
      </div>

      {/* Farm / Customer Context */}
      <div className="py-3 flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-stone-400">{portal === 'farmer' ? 'Customer:' : 'From:'}</span>
          <span className="text-stone-900 font-semibold">
            {portal === 'farmer' ? order.customer_name || order.customer_email : order.farmer.farm_name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-stone-500">
          <MapPin className="w-3 h-3 text-stone-400" />
          <span>{order.delivery_address_snapshot.province}</span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="bg-stone-50 rounded-xl p-3 mb-4 space-y-1.5 text-xs text-stone-700">
        {order.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="truncate pr-2 font-medium">
              {item.quantity} {item.unit_snapshot} × {item.product_name_snapshot}
            </span>
            <span className="font-semibold shrink-0 text-stone-900">
              ${parseFloat(item.subtotal).toFixed(2)}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="text-[11px] text-stone-400 pt-1">
            + {order.items.length - 3} more items
          </div>
        )}
      </div>

      {/* Total & Action Footer */}
      <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-bold">Total Paid</span>
          <span className="text-base font-extrabold text-stone-900">
            ${parseFloat(order.total).toFixed(2)}
          </span>
        </div>

        <Link
          to={detailUrl}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-600 text-forest-700 hover:text-white text-xs font-semibold transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

