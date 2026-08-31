import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Phone,
  Printer,
  FileText,
  AlertCircle,
  Clock,
  Package,
  Check,
} from 'lucide-react';
import { ordersApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Order } from '../../types';

export const FarmerOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('CONFIRMED');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['farmer-orders', statusFilter],
    queryFn: () => ordersApi.getFarmerOrders({ status: statusFilter || undefined }).then((res) => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordersApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-analytics'] });
      setSelectedOrder(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to update order status.';
      setErrorMessage(msg);
    },
  });

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setErrorMessage(null);
    const nextDefaults: Record<string, string> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    };
    setNewStatus(nextDefaults[order.status] || 'DELIVERED');
    setDriverName(order.delivery?.driver_name || '');
    setDriverPhone(order.delivery?.driver_phone || '');
  };

  const handleQuickStatusUpdate = (order: Order, status: string) => {
    updateStatusMutation.mutate({
      id: order.id,
      data: {
        status,
        driver_name: order.delivery?.driver_name || '',
        driver_phone: order.delivery?.driver_phone || '',
      },
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      data: {
        status: newStatus,
        driver_name: driverName,
        driver_phone: driverPhone,
      },
    });
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'OUT_FOR_DELIVERY':
      case 'READY':
        return 'info';
      case 'CONFIRMED':
      case 'PREPARING':
        return 'warning';
      case 'CANCELLED':
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const orders = ordersData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-display">Incoming Customer Orders</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage order confirmation, harvesting schedule, and delivery dispatch.</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'All Orders', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Harvesting / Preparing', value: 'PREPARING' },
          { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
          { label: 'Delivered', value: 'DELIVERED' },
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
        <div className="space-y-3">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="No orders found"
          description="Customer orders placed for your farm produce will appear here."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4 hover:border-stone-300 transition-all"
            >
              {/* Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-stone-900 font-mono text-sm">
                    #{order.order_number}
                  </span>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge variant={order.payment_status === 'PAID' ? 'success' : 'neutral'}>
                    {order.payment_status} ({order.payment_method})
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-stone-400">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-extrabold text-forest-800 font-mono text-base">
                    ${parseFloat(order.total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Grid: Buyer Address & Itemized produce */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Items */}
                <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    Items to Harvest & Pack
                  </span>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between font-medium text-stone-800">
                      <span>{item.quantity} {item.unit_snapshot} × {item.product_name_snapshot}</span>
                      <span className="font-bold text-stone-900">${parseFloat(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Customer Delivery Info */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-stone-700">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    Buyer & Destination
                  </span>
                  <p className="font-bold text-stone-900">{order.delivery_address_snapshot.recipient_name}</p>
                  <p>{order.delivery_address_snapshot.street_address}, {order.delivery_address_snapshot.province}</p>
                  <p className="text-stone-500 font-mono">{order.delivery_address_snapshot.phone_number}</p>
                  {order.customer_notes && (
                    <p className="text-forest-800 italic pt-1 border-t border-stone-200/60 mt-1">
                      Note: "{order.customer_notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Financial Accounting Breakdown for Farmer */}
              <div className="bg-forest-50/60 border border-forest-100 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Produce Subtotal</span>
                    <strong className="text-stone-900 font-mono text-sm">${parseFloat(order.subtotal).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Platform Commission ({order.commission_rate_percentage || '5'}%)
                    </span>
                    <strong className="text-amber-800 font-mono text-sm">
                      -${parseFloat(order.marketplace_commission).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-forest-700 block">Net Payout to Farm</span>
                    <strong className="text-forest-900 font-mono text-base font-extrabold">
                      ${(order.farmer_payout ? parseFloat(order.farmer_payout) : (parseFloat(order.subtotal) - parseFloat(order.marketplace_commission))).toFixed(2)}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-stone-500 italic">
                  ✓ 95% direct farm earnings guarantee
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
                {/* 1-Click Quick Progression Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusUpdate(order, 'CONFIRMED')}
                      isLoading={updateStatusMutation.isPending}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Confirm Order
                    </Button>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusUpdate(order, 'PREPARING')}
                      isLoading={updateStatusMutation.isPending}
                      leftIcon={<Package className="w-3.5 h-3.5" />}
                    >
                      Start Harvesting & Packing
                    </Button>
                  )}

                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusUpdate(order, 'READY')}
                      isLoading={updateStatusMutation.isPending}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Ready for Dispatch
                    </Button>
                  )}

                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickStatusUpdate(order, 'OUT_FOR_DELIVERY')}
                      isLoading={updateStatusMutation.isPending}
                      leftIcon={<Truck className="w-3.5 h-3.5" />}
                    >
                      Dispatch / Out for Delivery
                    </Button>
                  )}

                  {(order.status === 'OUT_FOR_DELIVERY' || order.status === 'READY' || order.status === 'PREPARING' || order.status === 'CONFIRMED') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusUpdate(order, 'DELIVERED')}
                      isLoading={updateStatusMutation.isPending}
                      className="text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>

                {/* PDF & Full Status Modal */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ordersApi.downloadPackingSlipPdf(order.id, order.order_number)}
                    className="text-amber-900 border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs"
                    leftIcon={<Printer className="w-3.5 h-3.5 text-amber-700" />}
                  >
                    Packing Slip (PDF)
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ordersApi.downloadInvoicePdf(order.id, order.order_number)}
                    className="text-stone-700 border-stone-200 bg-stone-100 hover:bg-stone-200 text-xs"
                    leftIcon={<FileText className="w-3.5 h-3.5 text-stone-500" />}
                  >
                    Invoice (PDF)
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openStatusModal(order)}
                    className="text-xs font-bold"
                  >
                    Custom Status...
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Fulfillment Status Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Update Order #${selectedOrder?.order_number}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Transition Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 font-bold"
            >
              <option value="CONFIRMED">Confirm Order (Schedule Harvest)</option>
              <option value="PREPARING">Harvesting & Packing Produce</option>
              <option value="READY">Packed & Ready for Dispatch</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered to Customer</option>
              <option value="REJECTED">Reject Order</option>
              <option value="CANCELLED">Cancel Order</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Driver Name (Optional)"
              placeholder="e.g. Sok Vanna"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
            <Input
              label="Driver Phone (Optional)"
              placeholder="+855 12 345 678"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="ghost" onClick={() => setSelectedOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateStatusMutation.isPending}>
              Apply Status Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
