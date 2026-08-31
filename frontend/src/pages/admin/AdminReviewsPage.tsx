import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../../api';
import { Button } from '../../components/common/Button';
import { StarRating } from '../../components/common/StarRating';
import { Skeleton } from '../../components/common/Skeleton';
import { Check, X } from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => reviewsApi.getAdminReviews().then((res) => res.data),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) =>
      reviewsApi.moderateReview(id, is_approved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Review Moderation</h1>
        <p className="text-xs text-stone-500 mt-0.5">Audit verified purchase feedback to ensure respectful and genuine reviews.</p>
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
                  <th className="p-4">Customer</th>
                  <th className="p-4">Produce & Farm</th>
                  <th className="p-4">Rating & Review</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {reviewsData?.results.map((rev) => (
                  <tr key={rev.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 font-bold text-stone-900">{rev.customer_name}</td>
                    <td className="p-4">
                      <span className="font-bold text-stone-900 block">{rev.product_name}</span>
                      <span className="text-stone-400">{rev.farm_name}</span>
                    </td>
                    <td className="p-4 max-w-xs space-y-1">
                      <StarRating rating={rev.rating} size="sm" showScore={false} />
                      <p className="font-bold text-stone-900">{rev.title}</p>
                      <p className="text-stone-600 line-clamp-2">{rev.comment}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rev.is_approved ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {rev.is_approved ? 'Approved' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant={rev.is_approved ? 'danger' : 'primary'}
                        onClick={() => moderateMutation.mutate({ id: rev.id, is_approved: !rev.is_approved })}
                      >
                        {rev.is_approved ? 'Hide Review' : 'Approve Review'}
                      </Button>
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

