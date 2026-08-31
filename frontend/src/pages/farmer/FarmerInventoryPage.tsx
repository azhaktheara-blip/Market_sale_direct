import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { productsApi } from '../../api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';

export const FarmerInventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [savedRow, setSavedRow] = useState<string | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: () => productsApi.getFarmerProducts().then((res) => res.data),
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ productId, stock }: { productId: string; stock: string }) =>
      productsApi.updateInventory(productId, { available_quantity: stock }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-analytics'] });
      setSavedRow(variables.productId);
      setTimeout(() => setSavedRow(null), 2000);
    },
  });

  const handleStockChange = (productId: string, val: string) => {
    setStockEdits((prev) => ({ ...prev, [productId]: val }));
  };

  const handleSaveStock = (productId: string, currentStock: string) => {
    const stockToSave = stockEdits[productId] !== undefined ? stockEdits[productId] : currentStock;
    updateInventoryMutation.mutate({ productId, stock: stockToSave });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-display">Live Inventory Management</h1>
          <p className="text-xs text-stone-500 mt-0.5">Quickly adjust available quantities as crops are harvested or restocked.</p>
        </div>
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
                  <th className="p-4">Produce</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Available Quantity</th>
                  <th className="p-4">Threshold</th>
                  <th className="p-4 text-right">Quick Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {productsData?.results.map((product) => {
                  const currentAvailable = product.available_stock || '0';
                  const isLow = parseFloat(currentAvailable) <= 5;
                  const isSaved = savedRow === product.id;

                  return (
                    <tr key={product.id} className={`hover:bg-stone-50/50 transition-colors ${isLow ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-stone-900">{product.name}</div>
                        <span className="text-[11px] text-stone-400 font-mono">${parseFloat(product.price).toFixed(2)} / {product.unit}</span>
                      </td>
                      <td className="p-4">
                        <Badge statusValue={product.status} size="sm" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={stockEdits[product.id] !== undefined ? stockEdits[product.id] : currentAvailable}
                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                            className="w-24 bg-white border border-stone-300 rounded-xl px-3 py-1.5 font-mono font-bold text-stone-900 focus:outline-none focus:border-forest-600 text-xs"
                          />
                          <span className="text-stone-500 text-xs font-semibold">{product.unit}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant={isSaved ? 'success' as any : 'outline'}
                          onClick={() => handleSaveStock(product.id, currentAvailable)}
                          isLoading={updateInventoryMutation.isPending && updateInventoryMutation.variables?.productId === product.id}
                          className={isSaved ? 'bg-emerald-600 text-white border-transparent' : ''}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" /> Saved
                            </>
                          ) : (
                            'Update'
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

