import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Star,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '../common/Button';
import type { ProductImage } from '../../types';

export interface LocalFilePreview {
  file: File;
  previewUrl: string;
  isPrimary?: boolean;
}

interface ImageUploaderProps {
  existingImages?: ProductImage[];
  pendingFiles: LocalFilePreview[];
  onAddFiles: (files: File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onDeleteExistingImage?: (imageId: string) => Promise<void>;
  onSetPrimaryExistingImage?: (imageId: string) => Promise<void>;
  onSetPrimaryPendingFile?: (index: number) => void;
  isLoading?: boolean;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  existingImages = [],
  pendingFiles = [],
  onAddFiles,
  onRemovePendingFile,
  onDeleteExistingImage,
  onSetPrimaryExistingImage,
  onSetPrimaryPendingFile,
  isLoading = false,
  maxFiles = 8,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCount = existingImages.length + pendingFiles.length;
  const isAtLimit = totalCount >= maxFiles;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAtLimit && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isLoading || isAtLimit) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onAddFiles(validFiles.slice(0, maxFiles - totalCount));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onAddFiles(validFiles.slice(0, maxFiles - totalCount));
      }
      e.target.value = '';
    }
  };

  const handleDeleteExisting = async (imageId: string) => {
    if (!onDeleteExistingImage) return;
    try {
      setActionInProgressId(imageId);
      await onDeleteExistingImage(imageId);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSetPrimaryExisting = async (imageId: string) => {
    if (!onSetPrimaryExistingImage) return;
    try {
      setActionInProgressId(imageId);
      await onSetPrimaryExistingImage(imageId);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
            Produce Photographs ({totalCount}/{maxFiles})
          </label>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Real farm photos increase customer confidence and ordering rates. First photo will be your main card cover.
          </p>
        </div>
        {totalCount === 0 && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/70 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 1 photo required to publish
          </span>
        )}
      </div>

      {/* Drag & Drop Zone */}
      {!isAtLimit && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-forest-600 bg-emerald-50/60 scale-[1.01]'
              : 'border-stone-300 hover:border-forest-500 bg-stone-50/50 hover:bg-emerald-50/20'
          } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">
                Click to browse or drag & drop produce photos
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                JPEG, PNG, or WebP up to 12MB. Automatic multi-resolution WebP compression.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {/* Existing Saved Images */}
          {existingImages.map((img) => (
            <div
              key={img.id}
              className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-stone-100 shadow-xs ${
                img.is_primary ? 'border-forest-600 ring-2 ring-forest-500/20' : 'border-stone-200'
              }`}
            >
              <img
                src={img.thumbnail_url || img.image}
                alt={img.alt_text || 'Produce'}
                className="w-full h-full object-cover"
              />

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {img.is_primary && (
                  <span className="px-2 py-0.5 rounded-md bg-forest-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                    <Star className="w-2.5 h-2.5 fill-white" /> Primary Cover
                  </span>
                )}
              </div>

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                {!img.is_primary && onSetPrimaryExistingImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimaryExisting(img.id);
                    }}
                    disabled={actionInProgressId === img.id}
                    className="p-2 rounded-xl bg-white/90 text-stone-700 hover:text-forest-700 hover:bg-white text-xs font-bold shadow-xs transition-transform hover:scale-105"
                    title="Make Primary Cover"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDeleteExistingImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExisting(img.id);
                    }}
                    disabled={actionInProgressId === img.id}
                    className="p-2 rounded-xl bg-white/90 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold shadow-xs transition-transform hover:scale-105"
                    title="Delete Image"
                  >
                    {actionInProgressId === img.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pending Newly Uploaded Files (Before Final Save) */}
          {pendingFiles.map((item, idx) => (
            <div
              key={idx}
              className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-stone-100 shadow-xs ${
                item.isPrimary ? 'border-forest-600 ring-2 ring-forest-500/20' : 'border-stone-200 border-dashed'
              }`}
            >
              <img
                src={item.previewUrl}
                alt="New upload"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {item.isPrimary ? (
                  <span className="px-2 py-0.5 rounded-md bg-forest-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                    <Star className="w-2.5 h-2.5 fill-white" /> Primary Cover
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                    Ready to Save
                  </span>
                )}
              </div>

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                {!item.isPrimary && onSetPrimaryPendingFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrimaryPendingFile(idx);
                    }}
                    className="p-2 rounded-xl bg-white/90 text-stone-700 hover:text-forest-700 hover:bg-white text-xs font-bold shadow-xs transition-transform hover:scale-105"
                    title="Make Primary Cover"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePendingFile(idx);
                  }}
                  className="p-2 rounded-xl bg-white/90 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold shadow-xs transition-transform hover:scale-105"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

