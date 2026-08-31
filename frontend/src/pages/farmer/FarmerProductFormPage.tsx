import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle2, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';
import { productsApi, aiApi } from '../../api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ImageUploader, LocalFilePreview } from '../../components/products/ImageUploader';
import type { Product, ProductImage } from '../../types';

export const FarmerProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<'KG' | 'GRAM' | 'TON' | 'BASKET' | 'BOX' | 'BUNCH' | 'PIECE' | 'LITER'>('KG');
  const [minQty, setMinQty] = useState('1.00');
  const [stock, setStock] = useState('50.00');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [isOrganic, setIsOrganic] = useState(true);
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK'>('ACTIVE');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Image Management State
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<LocalFilePreview[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleGenerateWithAi = async () => {
    if (!name.trim()) return;
    try {
      setIsGeneratingAi(true);
      const res = await aiApi.generateDescription({
        crop_name: name.trim(),
        bullet_points: shortDesc || 'organically grown, picked fresh daily, vibrant aroma',
        farming_practice: isOrganic ? 'ORGANIC' : 'CONVENTIONAL',
      });
      if (res.data) {
        setShortDesc(res.data.short_description);
        setDescription(res.data.full_description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then((res) => res.data),
  });

  // Fetch Existing Product (if editing)
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['farmer-product-edit', id],
    queryFn: () => productsApi.getFarmerProducts().then((res) => {
      const match = res.data.results.find((p) => p.id === id);
      return match;
    }),
    enabled: isEditing,
  });

  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setCategoryId(existingProduct.category?.id || '');
      setShortDesc(existingProduct.short_description || '');
      setDescription(existingProduct.description || '');
      setPrice(existingProduct.price);
      setUnit(existingProduct.unit);
      setMinQty(existingProduct.minimum_order_qty);
      setStock(existingProduct.available_stock || '50.00');
      setHarvestDate(existingProduct.harvest_date);
      setIsOrganic(existingProduct.is_organic);
      setStatus(existingProduct.status as any);
      setExistingImages(existingProduct.images || []);
    }
  }, [existingProduct]);

  // Handle adding local files
  const handleAddFiles = (newFiles: File[]) => {
    const previews: LocalFilePreview[] = newFiles.map((file, idx) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: existingImages.length === 0 && pendingFiles.length === 0 && idx === 0,
    }));
    setPendingFiles((prev) => [...prev, ...previews]);
    setFormError(null);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!id) return;
    await productsApi.deleteProductImage(id, imageId);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
  };

  const handleSetPrimaryExistingImage = async (imageId: string) => {
    if (!id) return;
    await productsApi.setPrimaryProductImage(id, imageId);
    setExistingImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      }))
    );
    queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
  };

  const handleSetPrimaryPendingFile = (index: number) => {
    setPendingFiles((prev) =>
      prev.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      }))
    );
  };

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (isEditing) {
        return productsApi.updateProduct(id!, formData);
      }
      return productsApi.createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-analytics'] });
      navigate('/farmer/products');
    },
    onError: (err: any) => {
      const errorMsg =
        err.response?.data?.status ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save produce listing. Please check inputs.';
      setFormError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const totalImagesCount = existingImages.length + pendingFiles.length;
    if (status === 'ACTIVE' && totalImagesCount === 0) {
      setFormError('At least 1 produce photograph is required before publishing as Active. Upload a photo or select Draft status.');
      return;
    }

    const formData = new FormData();
    formData.append('category', categoryId);
    formData.append('name', name);
    formData.append('short_description', shortDesc);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('unit', unit);
    formData.append('minimum_order_qty', minQty);
    formData.append('initial_stock', stock);
    formData.append('harvest_date', harvestDate);
    formData.append('is_organic', isOrganic ? 'true' : 'false');
    formData.append('status', status);

    pendingFiles.forEach((p) => {
      formData.append('uploaded_images', p.file);
    });

    mutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link to="/farmer/products" className="text-xs font-semibold text-forest-700 hover:underline inline-flex items-center gap-1 mb-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Produce List
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">
          {isEditing ? 'Edit Produce Listing' : 'List New Produce Harvest'}
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Specify crop details, harvest dates, fair pricing, and upload high-resolution images.
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Produce Name" placeholder="e.g. Organic Siem Reap Vine Tomatoes" value={name} onChange={(e) => setName(e.target.value)} required />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
              required
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Price (USD)" type="number" step="0.01" min="0.01" placeholder="2.50" value={price} onChange={(e) => setPrice(e.target.value)} required />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900"
            >
              <option value="KG">Kilogram (kg)</option>
              <option value="GRAM">Gram (g)</option>
              <option value="TON">Metric Ton</option>
              <option value="BASKET">Basket</option>
              <option value="BOX">Box / Crate</option>
              <option value="BUNCH">Bunch</option>
              <option value="PIECE">Piece / Unit</option>
              <option value="LITER">Liter</option>
            </select>
          </div>

          <Input label="Minimum Order" type="number" step="0.5" min="0.5" placeholder="1.0" value={minQty} onChange={(e) => setMinQty(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Available Harvest Stock" type="number" step="1" min="0" placeholder="100" value={stock} onChange={(e) => setStock(e.target.value)} required />
          <Input label="Harvest Date" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} required />
        </div>

        <Input label="Short Highlight" placeholder="1 sentence hook for product card" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} required />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Detailed Crop Description & Culinary Notes
            </label>
            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={isGeneratingAi || !name.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Crafting Story...' : '✨ Generate with AI Assistant'}</span>
            </button>
          </div>

          <textarea
            rows={5}
            placeholder="Describe farming techniques, flavor profile, nutrient highlights, storage tips... or click 'Generate with AI Assistant' above!"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-2xl p-3.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600 shadow-2xs leading-relaxed"
            required
          />
        </div>

        {/* Drag & Drop Multi-Resolution Image Uploader */}
        <div className="pt-2 border-t border-stone-100">
          <ImageUploader
            existingImages={existingImages}
            pendingFiles={pendingFiles}
            onAddFiles={handleAddFiles}
            onRemovePendingFile={handleRemovePendingFile}
            onDeleteExistingImage={handleDeleteExistingImage}
            onSetPrimaryExistingImage={handleSetPrimaryExistingImage}
            onSetPrimaryPendingFile={handleSetPrimaryPendingFile}
            isLoading={mutation.isPending}
          />
        </div>

        {/* Listing Status & Organic Certification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Listing Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-bold"
            >
              <option value="ACTIVE">Active (Live in Marketplace)</option>
              <option value="DRAFT">Draft (Saved Privately)</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOrganic}
                onChange={(e) => setIsOrganic(e.target.checked)}
                className="w-4 h-4 text-forest-600 rounded border-stone-300"
              />
              <span className="text-xs font-bold text-stone-800">Certified Organic Produce</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-stone-100">
          <Button type="button" variant="ghost" onClick={() => navigate('/farmer/products')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Publish Produce Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
};
