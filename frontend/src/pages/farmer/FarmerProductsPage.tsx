import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Package, AlertCircle } from 'lucide-react';
import { productsApi } from '../../api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const FarmerProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: () => productsApi.getFarmerProducts().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer-products'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-display">Manage Produce Catalog</h1>
          <p className="text-xs text-stone-500 mt-0.5">Add, update prices, or edit agricultural listings for this farm.</p>
        </div>
        <Link to="/farmer/products/new">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add New Produce
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : productsData?.results.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No produce listed yet"
          description="Start selling directly to customers by adding your first harvested crops."
          actionLabel="Add Produce"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="p-4">Produce Item</th>
                  <th className="p-4">Price / Unit</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Harvest Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {productsData?.results.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          {product.primary_image ? (
                            <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-sm">🌱</span>
                          )}
                        </div>
                        <div>
                          <Link to={`/products/${product.slug}`} className="font-bold text-stone-900 hover:text-forest-700">
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {product.is_organic && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Organic</span>}
                            <span className="text-[10px] text-stone-400">{product.category_name}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-stone-900">
                      ${parseFloat(product.price).toFixed(2)} / {product.unit}
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-stone-900">
                        {product.available_stock || 0} {product.unit}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500">{product.harvest_date}</td>
                    <td className="p-4">
                      <Badge statusValue={product.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/farmer/products/${product.id}/edit`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-forest-700 hover:bg-forest-50 transition-colors"
                          title="Edit produce"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

