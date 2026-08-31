import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Repeat,
  Calendar,
  CheckCircle2,
  Pause,
  Play,
  XCircle,
  Plus,
  Truck,
  Sparkles,
  MapPin,
  Sprout,
  Package,
} from 'lucide-react';
import { subscriptionsApi, productsApi, addressesApi, farmersApi } from '../../api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import type { Subscription, Product, Address, FarmerSummary } from '../../types';

export const CustomerSubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Subscription Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');
  const [deliveryDay, setDeliveryDay] = useState<string>('Tuesday');
  const [quantity, setQuantity] = useState<number>(5);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BAKONG_QR' | 'CREDIT_CARD'>('COD');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: rawSubscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getSubscriptions().then((res) => res.data),
  });

  const subscriptions: Subscription[] = Array.isArray(rawSubscriptions)
    ? rawSubscriptions
    : (rawSubscriptions as any)?.results || [];

  // Available Products for Subscription
  const { data: productsData } = useQuery({
    queryKey: ['active-products-sub'],
    queryFn: () => productsApi.getProducts({ page_size: 50 }).then((res) => res.data),
  });

  // User Saved Addresses
  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAddresses().then((res) => res.data),
  });

  const products = productsData?.results || [];
  const addresses = addressesData || [];

  // Set default product and address when opened
  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [products, addresses, selectedProductId, selectedAddressId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // 10% Subscriber discount
  const basePrice = selectedProduct ? parseFloat(selectedProduct.price) : 0;
  const discountedUnitPrice = basePrice * 0.90;
  const estimatedTotal = (discountedUnitPrice * quantity).toFixed(2);

  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsCreateModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to create subscription.';
      setErrorMessage(msg);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' }) =>
      subscriptionsApi.updateSubscriptionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setErrorMessage(null);

    createSubscriptionMutation.mutate({
      farmer_id: selectedProduct.farmer.id,
      frequency,
      delivery_day: deliveryDay,
      address_id: selectedAddressId || undefined,
      payment_method: paymentMethod,
      customer_notes: customerNotes,
      items: [
        {
          product_id: selectedProduct.id,
          quantity: quantity,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-display">Harvest Subscriptions</h1>
          <p className="text-xs text-stone-500 mt-0.5">Recurring weekly & bi-weekly wholesale deliveries direct from local farms.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Subscription
        </Button>
      </div>

      {/* Subscription Benefits Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Automatic 10% Subscriber Discount + Priority Morning Harvest</h3>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Subscribe to guaranteed weekly crops from verified growers. Zero stockouts, automatic deliveries, pause or cancel anytime.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs font-bold text-forest-800 border-forest-300 bg-white hover:bg-forest-50 shrink-0"
        >
          Subscribe Now
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Repeat className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">No active subscriptions yet</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Set up auto-repeating weekly orders for fresh organic vegetables, citrus fruits, and restaurant produce with 10% off.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Start a Subscription
            </Button>
            <Link to="/products">
              <Button variant="outline" size="md">
                Browse Fresh Produce
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const isPaused = sub.status === 'PAUSED';
            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4 hover:border-stone-300 transition-all"
              >
                {/* Top Row: Farmer & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm shadow-xs">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <Link
                        to={`/farmers/${sub.farmer?.slug}`}
                        className="font-bold text-stone-900 text-sm hover:text-forest-700"
                      >
                        {sub.farmer?.farm_name || 'Partner Farm'}
                      </Link>
                      <span className="text-[11px] text-stone-400 block">
                        {sub.frequency} Delivery • Every {sub.delivery_day}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>

                {/* Items in Subscription */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Recurring Harvest Items
                    </span>
                    {sub.items?.map((it) => (
                      <div key={it.id} className="flex justify-between items-center font-medium text-stone-800">
                        <span className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-forest-600" />
                          <span>{it.quantity} {it.product?.unit || 'KG'} × {it.product?.name}</span>
                        </span>
                        <span className="font-bold font-mono text-stone-900">${it.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2 text-stone-700">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Dispatch Schedule & Destination
                    </span>
                    <div className="flex items-center gap-2 text-forest-800 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-forest-600" />
                      <span>Next Delivery: {sub.next_delivery_date || 'Upcoming Tuesday'}</span>
                    </div>
                    {sub.delivery_address && (
                      <div className="flex items-start gap-1.5 text-stone-500 text-[11px]">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                        <span>{sub.delivery_address.street_address}, {sub.delivery_address.province}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
                  <div className="text-xs font-semibold text-stone-600">
                    Estimated per cycle: <span className="font-mono font-extrabold text-stone-900 text-sm">${sub.estimated_total}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatusMutation.mutate({ id: sub.id, status: 'PAUSED' })}
                        isLoading={toggleStatusMutation.isPending}
                        className="text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
                        leftIcon={<Pause className="w-3.5 h-3.5 text-amber-600" />}
                      >
                        Pause Subscription
                      </Button>
                    ) : sub.status === 'PAUSED' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => toggleStatusMutation.mutate({ id: sub.id, status: 'ACTIVE' })}
                        isLoading={toggleStatusMutation.isPending}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Resume Subscription
                      </Button>
                    ) : null}

                    {sub.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatusMutation.mutate({ id: sub.id, status: 'CANCELLED' })}
                        isLoading={toggleStatusMutation.isPending}
                        className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Subscription Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start a Recurring Harvest Subscription"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Select Fresh Produce Crop
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 font-bold focus:outline-none focus:border-forest-600"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price}/{p.unit} ({p.farmer.farm_name}, {p.farmer.province})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Frequency */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Recurring Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full bg-white border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-900 font-semibold"
              >
                <option value="WEEKLY">Weekly Delivery (Every Week)</option>
                <option value="BIWEEKLY">Bi-Weekly Delivery (Every 2 Weeks)</option>
                <option value="MONTHLY">Monthly Bulk Delivery</option>
              </select>
            </div>

            {/* Delivery Day */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Preferred Delivery Day
              </label>
              <select
                value={deliveryDay}
                onChange={(e) => setDeliveryDay(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-900 font-semibold"
              >
                <option value="Monday">Every Monday Morning</option>
                <option value="Tuesday">Every Tuesday Morning</option>
                <option value="Wednesday">Every Wednesday Morning</option>
                <option value="Thursday">Every Thursday Morning</option>
                <option value="Friday">Every Friday Morning</option>
                <option value="Saturday">Every Saturday Morning</option>
                <option value="Sunday">Every Sunday Morning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Crate Quantity per Delivery ({selectedProduct?.unit || 'KG'})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-stone-300 rounded-2xl p-2.5 text-xs font-bold text-stone-900"
                  required
                />
                <span className="text-xs font-bold text-stone-500">{selectedProduct?.unit || 'KG'}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-white border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-900 font-semibold"
              >
                <option value="COD">Cash On Delivery (COD)</option>
                <option value="BAKONG_QR">Bakong KHQR Mobile Pay</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Delivery Destination
            </label>
            {addresses.length > 0 ? (
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-900 font-semibold"
              >
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label}: {addr.street_address}, {addr.province} ({addr.recipient_name})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Default location will be used. You can manage saved addresses under Profile.
              </p>
            )}
          </div>

          {/* Notes */}
          <Input
            label="Special Delivery Notes (Optional)"
            placeholder="e.g. Ring restaurant kitchen bell, leave crate with Chef"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
          />

          {/* Price Summary Breakdown */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>Standard Retail Rate:</span>
              <span className="line-through">${(basePrice * quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>Subscriber 10% Discount:</span>
              <span>-${((basePrice * 0.10) * quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-1 border-t border-emerald-200/80">
              <span>Estimated per Cycle:</span>
              <span className="font-mono text-forest-900">${estimatedTotal}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createSubscriptionMutation.isPending}>
              Confirm & Start Subscription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
