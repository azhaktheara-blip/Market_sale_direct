import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Star,
  ChevronLeft,
  XCircle,
  FileText,
} from 'lucide-react';
import { ordersApi, reviewsApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { StarRating } from '../../components/common/StarRating';
import { Skeleton } from '../../components/common/Skeleton';
import { BakongPaymentModal } from '../../components/payments/BakongPaymentModal';
import { CardPaymentModal } from '../../components/payments/CardPaymentModal';
import type { OrderItem } from '../../types';

export const CustomerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  
  const [isBakongModalOpen, setIsBakongModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrderDetail(id!).then((res) => res.data),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id!, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setIsCancelModalOpen(false);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewsApi.createReview({
        order_item_id: reviewItem!.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setReviewItem(null);
      setReviewTitle('');
      setReviewComment('');
    },
  });

  if (isLoading || !order) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Sent to grower' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Harvest scheduled' },
    { key: 'PREPARING', label: 'Harvesting', desc: 'Freshly gathered' },
    { key: 'OUT_FOR_DELIVERY', label: 'In Transit', desc: 'Direct farm dispatch' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Arrived at destination' },
  ];

  const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <Link to="/customer/orders" className="text-xs font-semibold text-forest-700 hover:underline inline-flex items-center gap-1 mb-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-stone-900 font-display">
              Order #{order.order_number}
            </h1>
            <Badge statusValue={order.status} size="md" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => ordersApi.downloadInvoicePdf(order.id, order.order_number)}
            className="text-forest-800 border-forest-200 bg-forest-50 hover:bg-forest-100"
            leftIcon={<FileText className="w-3.5 h-3.5 text-forest-600" />}
          >
            Download Tax Invoice (PDF)
          </Button>

          {['PENDING', 'CONFIRMED'].includes(order.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {!isCancelled ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft">
          <h3 className="text-sm font-bold text-stone-900 mb-6 uppercase tracking-wider">
            Harvest & Delivery Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
            {steps.map((step, idx) => {
              const stepIdx = statusOrder.indexOf(step.key);
              const isCompleted = currentIndex >= stepIdx;
              const isCurrent = currentIndex === stepIdx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                      isCompleted
                        ? 'bg-forest-600 text-white shadow-sm ring-4 ring-forest-50'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isCurrent ? 'text-forest-700' : 'text-stone-800'}`}>
                      {step.label}
                    </h4>
                    <p className="text-[10px] text-stone-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>This order was cancelled</span>
          </div>
          {order.cancellation_reason && (
            <p className="text-rose-700">Reason: {order.cancellation_reason}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Ordered Produce</h3>
            <Link to={`/farmers/${order.farmer.slug}`} className="text-xs font-bold text-forest-700 hover:underline">
              {order.farmer.farm_name} ({order.farmer.province})
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{item.product_name_snapshot}</h4>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {item.quantity} {item.unit_snapshot} × ${parseFloat(item.unit_price_snapshot).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-stone-900 text-sm">
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </span>

                  {order.status === 'DELIVERED' && (
                    <div>
                      {item.has_reviewed ? (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Reviewed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewItem(item)}
                          leftIcon={<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        >
                          Write Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Produce Subtotal</span>
              <span className="font-bold text-stone-900">${order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Farm Direct Delivery Fee</span>
              <span className="font-bold text-stone-900">${order.delivery_fee}</span>
            </div>
            <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-stone-900">
              <span className="text-sm font-bold">Total Paid</span>
              <span className="text-xl font-extrabold text-forest-700">${order.total}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4 text-xs text-stone-700">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              Delivery Details
            </h3>
            <div className="space-y-1">
              <strong className="block text-stone-900 font-bold">{order.delivery_address_snapshot.recipient_name}</strong>
              <p>{order.delivery_address_snapshot.street_address}</p>
              <p>{order.delivery_address_snapshot.district ? `${order.delivery_address_snapshot.district}, ` : ''}{order.delivery_address_snapshot.province}</p>
              <p className="text-stone-500 mt-1">{order.delivery_address_snapshot.phone_number}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-3 text-xs text-stone-700">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              Payment Information
            </h3>
            <div className="flex justify-between items-center">
              <span>Method:</span>
              <strong className="text-stone-900 font-bold">{order.payment_method}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Status:</span>
              <Badge statusValue={order.payment_status} size="sm" />
            </div>
            {order.payment_status === 'PENDING' && order.payment_method !== 'COD' && !isCancelled && (
              <div className="pt-4 border-t border-stone-100">
                <Button 
                  onClick={() => order.payment_method === 'BAKONG_QR' ? setIsBakongModalOpen(true) : setIsCardModalOpen(true)}
                  variant="primary" 
                  size="sm" 
                  className="w-full font-bold"
                >
                  Pay Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <BakongPaymentModal
        isOpen={isBakongModalOpen}
        onClose={() => setIsBakongModalOpen(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        totalAmountUSD={order.total}
        onPaymentSuccess={() => {
          setIsBakongModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['order', id] });
        }}
      />

      <CardPaymentModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        totalAmountUSD={order.total}
        onPaymentSuccess={() => {
          setIsCardModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['order', id] });
        }}
      />

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Order"
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600">
            Are you sure you want to cancel this order? The reserved produce inventory will be immediately released back to the farm catalog.
          </p>
          <textarea
            rows={3}
            placeholder="Reason for cancellation (optional)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>
              Keep Order
            </Button>
            <Button
              variant="danger"
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!reviewItem}
        onClose={() => setReviewItem(null)}
        title={`Review ${reviewItem?.product_name_snapshot}`}
      >
        <div className="space-y-4">
          <div className="text-center pb-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              How fresh was your produce?
            </label>
            <StarRating
              rating={reviewRating}
              interactive
              onRatingChange={setReviewRating}
              size="lg"
            />
          </div>

          <Input
            label="Review Headline"
            placeholder="e.g. Incredibly fresh and sweet tomatoes!"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Detailed Experience
            </label>
            <textarea
              rows={4}
              placeholder="Tell other buyers about the flavor, aroma, packaging, and delivery experience..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setReviewItem(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => reviewMutation.mutate()}
              isLoading={reviewMutation.isPending}
              disabled={!reviewTitle || !reviewComment || reviewMutation.isPending}
            >
              Submit Verified Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

