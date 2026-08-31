import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Banknote,
  QrCode,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { addressesApi, ordersApi } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import type { Address } from '../../types';

import { BakongPaymentModal } from '../../components/payments/BakongPaymentModal';
import { CardPaymentModal } from '../../components/payments/CardPaymentModal';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BAKONG_QR' | 'CREDIT_CARD'>('COD');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Payment Modals State
  const [isBakongModalOpen, setIsBakongModalOpen] = useState<boolean>(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_number: string; total: string } | null>(null);

  const [newRecipientName, setNewRecipientName] = useState(user?.username || '');
  const [newPhone, setNewPhone] = useState(user?.phone_number || '');
  const [newProvince, setNewProvince] = useState('Siem Reap');
  const [newDistrict, setNewDistrict] = useState('Siem Reap');
  const [newStreet, setNewStreet] = useState('');

  const provinces = [
    'Siem Reap',
    'Battambang',
    'Kampot',
    'Kandal',
    'Pursat',
    'Koh Kong',
    'Mondulkiri',
    'Takeo',
    'Kampong Cham',
    'Kratie',
    'Phnom Penh',
  ];

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAddresses().then((res) => res.data),
    enabled: isAuthenticated,
  });

  React.useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const addAddressMutation = useMutation({
    mutationFn: (data: Partial<Address>) => addressesApi.createAddress(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelectedAddressId(res.data.id);
      setIsAddressModalOpen(false);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      ordersApi.checkout({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        customer_notes: customerNotes,
      }),
    onSuccess: async (res) => {
      await refreshCart();
      const firstOrder = res.data.orders[0];
      if (firstOrder) {
        setCreatedOrder({
          id: firstOrder.id,
          order_number: firstOrder.order_number,
          total: firstOrder.total,
        });

        if (paymentMethod === 'BAKONG_QR') {
          setIsBakongModalOpen(true);
        } else if (paymentMethod === 'CREDIT_CARD') {
          setIsCardModalOpen(true);
        } else {
          navigate('/customer/orders', {
            state: { newOrderSuccess: true, orderCount: res.data.orders.length },
          });
        }
      } else {
        navigate('/customer/orders', {
          state: { newOrderSuccess: true, orderCount: res.data.orders.length },
        });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.errors?.detail || 'Checkout failed.';
      setCheckoutError(msg);
    },
  });

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName || !newPhone || !newStreet) return;
    addAddressMutation.mutate({
      label: 'Delivery Location',
      recipient_name: newRecipientName,
      phone_number: newPhone,
      province: newProvince,
      district: newDistrict,
      street_address: newStreet,
      is_default: true,
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Your cart is empty</h2>
        <p className="text-xs text-stone-500">Please add items to your cart before proceeding to checkout.</p>
        <Link to="/products">
          <Button variant="primary">Shop Produce</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display">
          Checkout & Order Confirmation
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review your delivery details, payment preference, and submit orders directly to {cart.farmer_groups.length} farm(s).
        </p>
      </div>

      {checkoutError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Delivery Address Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="text-base font-bold text-stone-900">Delivery Address</h2>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddressModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add New Address
              </Button>
            </div>

            {addresses && addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-forest-600 bg-forest-50/40 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-900">{addr.label}</span>
                        {selectedAddressId === addr.id && (
                          <CheckCircle2 className="w-4 h-4 text-forest-600" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-stone-800">{addr.recipient_name}</p>
                      <p className="text-xs text-stone-600 mt-0.5">{addr.street_address}</p>
                      <p className="text-xs text-stone-400">{addr.district ? `${addr.district}, ` : ''}{addr.province}</p>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium mt-2">{addr.phone_number}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
                <p className="text-xs text-stone-500">No delivery address saved yet.</p>
                <Button variant="primary" size="sm" onClick={() => setIsAddressModalOpen(true)}>
                  Add Delivery Address
                </Button>
              </div>
            )}
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
              <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-base font-bold text-stone-900">Select Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                  paymentMethod === 'COD'
                    ? 'border-forest-600 bg-forest-50/40 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Banknote className="w-5 h-5 text-forest-600" />
                  {paymentMethod === 'COD' && <CheckCircle2 className="w-4 h-4 text-forest-600" />}
                </div>
                <h3 className="text-xs font-bold text-stone-900">Cash on Delivery</h3>
                <p className="text-[11px] text-stone-500">Pay directly when fresh produce is delivered.</p>
              </div>

              <div
                onClick={() => setPaymentMethod('BAKONG_QR')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                  paymentMethod === 'BAKONG_QR'
                    ? 'border-forest-600 bg-forest-50/40 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <QrCode className="w-5 h-5 text-teal-600" />
                  {paymentMethod === 'BAKONG_QR' && <CheckCircle2 className="w-4 h-4 text-forest-600" />}
                </div>
                <h3 className="text-xs font-bold text-stone-900">Bakong / KHQR</h3>
                <p className="text-[11px] text-stone-500">Scan & pay instantly with any Cambodian bank app.</p>
              </div>

              <div
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-forest-600 bg-forest-50/40 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  {paymentMethod === 'CREDIT_CARD' && <CheckCircle2 className="w-4 h-4 text-forest-600" />}
                </div>
                <h3 className="text-xs font-bold text-stone-900">Credit / Debit Card</h3>
                <p className="text-[11px] text-stone-500">Encrypted card transaction escrow.</p>
              </div>
            </div>
          </div>

          {/* 3. Delivery Notes */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-3">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Delivery Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Leave crate by the restaurant kitchen door, call on arrival..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
              Produce from {cart.farmer_groups.length} Farm(s)
            </h3>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {cart.farmer_groups.map((g) => (
                <div key={g.farmer_id} className="text-xs space-y-1.5 pb-3 border-b border-stone-100 last:border-none">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>{g.farm_name}</span>
                    <span>${g.total}</span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    {g.items.length} produce types • Delivery fee: ${g.delivery_fee}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">${cart.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Delivery Fees</span>
                <span className="font-bold text-stone-900">${cart.delivery_fee}</span>
              </div>
              <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-stone-900">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-2xl font-extrabold text-forest-700">${cart.total}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                if (!selectedAddressId) {
                  setIsAddressModalOpen(true);
                } else {
                  checkoutMutation.mutate();
                }
              }}
              isLoading={checkoutMutation.isPending}
              disabled={checkoutMutation.isPending}
              variant="primary"
              size="lg"
              className="w-full rounded-2xl font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {!selectedAddressId
                ? 'Add Delivery Address & Continue'
                : `Place Order & Pay with ${paymentMethod === 'BAKONG_QR' ? 'KHQR' : paymentMethod === 'CREDIT_CARD' ? 'Card' : 'COD'} ($${cart.total})`}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add New Delivery Address"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <Input
            label="Recipient Full Name"
            value={newRecipientName}
            onChange={(e) => setNewRecipientName(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                Province
              </label>
              <select
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <Input
              label="District"
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              required
            />
          </div>

          <Input
            label="Street Address / House #"
            placeholder="e.g. Wat Bo Road, House #45B"
            value={newStreet}
            onChange={(e) => setNewStreet(e.target.value)}
            required
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addAddressMutation.isPending}>
              Save Address
            </Button>
          </div>
        </form>
      </Modal>

      {createdOrder && (
        <>
          <BakongPaymentModal
            isOpen={isBakongModalOpen}
            onClose={() => {
              setIsBakongModalOpen(false);
              navigate('/customer/orders', { state: { newOrderSuccess: true } });
            }}
            orderId={createdOrder.id}
            orderNumber={createdOrder.order_number}
            totalAmountUSD={createdOrder.total}
            onPaymentSuccess={() => {
              setIsBakongModalOpen(false);
              navigate('/customer/orders', { state: { newOrderSuccess: true, paymentPaid: true } });
            }}
          />

          <CardPaymentModal
            isOpen={isCardModalOpen}
            onClose={() => {
              setIsCardModalOpen(false);
              navigate('/customer/orders', { state: { newOrderSuccess: true } });
            }}
            orderId={createdOrder.id}
            orderNumber={createdOrder.order_number}
            totalAmountUSD={createdOrder.total}
            onPaymentSuccess={() => {
              setIsCardModalOpen(false);
              navigate('/customer/orders', { state: { newOrderSuccess: true, paymentPaid: true } });
            }}
          />
        </>
      )}
    </div>
  );
};

