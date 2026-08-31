import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminProductsPage: React.FC = () => {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.getProducts({ page_size: 50 }).then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Product Moderation</h1>
        <p className="text-xs text-stone-500 mt-0.5">Platform catalog oversight and listings audit.</p>
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
                  <th className="p-4">Produce Name</th>
                  <th className="p-4">Farm</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price / Unit</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {productsData?.results.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 font-bold text-stone-900">{product.name}</td>
                    <td className="p-4 text-stone-600">{product.farmer.farm_name}</td>
                    <td className="p-4 text-stone-400">{product.category_name}</td>
                    <td className="p-4 font-bold text-stone-900">${parseFloat(product.price).toFixed(2)} / {product.unit}</td>
                    <td className="p-4">{parseFloat(product.rating_avg).toFixed(1)} ★ ({product.rating_count})</td>
                    <td className="p-4">
                      <Badge statusValue={product.status} size="sm" />
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

