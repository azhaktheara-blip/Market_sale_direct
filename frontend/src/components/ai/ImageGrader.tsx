import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  X,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { fastapiAiApi } from '../../api/fastapiAi';
import { VisionGradeResponse } from '../../types/ai';

interface ImageGraderProps {
  onGradeComplete?: (gradeData: VisionGradeResponse) => void;
  className?: string;
}

export const ImageGrader: React.FC<ImageGraderProps> = ({
  onGradeComplete,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropName, setCropName] = useState('Organic Tomatoes');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gradeResult, setGradeResult] = useState<VisionGradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListed, setIsListed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setIsListed(false);

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto trigger grade inspection
    triggerGrading(file);
  };

  const triggerGrading = async (fileToGrade?: File) => {
    const targetFile = fileToGrade || selectedFile;
    if (!targetFile) {
      setError('Please select or capture a produce photograph first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fastapiAiApi.gradeProduceImage(targetFile, cropName);
      setGradeResult(response);
      if (onGradeComplete) {
        onGradeComplete(response);
      }
    } catch (err: any) {
      console.error('Vision grading error:', err);
      setError(err.message || 'Inspection failed. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGradeResult(null);
    setError(null);
    setIsListed(false);
  };

  // Grade color badges
  const getGradeTheme = (grade: string) => {
    if (grade.includes('A')) {
      return {
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        border: 'border-emerald-500',
        cardBg: 'from-emerald-50/40 via-white to-emerald-50/20',
        iconBg: 'bg-emerald-100 text-emerald-700',
        badgeTitle: 'Grade A Certified',
        tier: 'Premium Export & Supermarket Grade',
      };
    }
    if (grade.includes('B')) {
      return {
        badgeBg: 'bg-amber-500',
        badgeText: 'text-stone-950',
        border: 'border-amber-400',
        cardBg: 'from-amber-50/40 via-white to-amber-50/20',
        iconBg: 'bg-amber-100 text-amber-800',
        badgeTitle: 'Grade B Standard',
        tier: 'Standard Wholesale & Restaurant Grade',
      };
    }
    return {
      badgeBg: 'bg-rose-600',
      badgeText: 'text-white',
      border: 'border-rose-400',
      cardBg: 'from-rose-50/40 via-white to-rose-50/20',
      iconBg: 'bg-rose-100 text-rose-800',
      badgeTitle: 'Grade C Processing',
      tier: 'Food Processing & Sauces',
    };
  };

  const gradeTheme = gradeResult ? getGradeTheme(gradeResult.grade) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>GPT-4o / Gemini Agricultural Vision</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
              AI Produce Quality Inspector
            </h2>
            <p className="text-xs text-stone-500 max-w-xl">
              Upload or snap a photo of fresh produce. The AI acts as an Expert Agricultural Inspector, certifying quality grade, measuring defects, and recommending fair market pricing.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              FastAPI Endpoint
            </span>
            <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              POST /api/ai-vision-grade
            </code>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-6 relative rounded-3xl border-2 border-dashed transition-all p-6 sm:p-8 flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
              : 'border-stone-300 hover:border-emerald-400 bg-stone-50/60 hover:bg-emerald-50/20'
          }`}
        >
          {previewUrl ? (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Image Preview with Scanner Beam Effect while loading */}
              <div className="relative w-full max-w-md h-56 sm:h-64 rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-black">
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  className="w-full h-full object-cover"
                />

                {/* Animated Laser Scanning Line */}
                {isLoading && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]" />
                  </div>
                )}

                {/* Close / Retake Button */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-all shadow-md"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerGrading()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Produce Multi-Spectrally...</span>
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4" />
                      <span>Re-Inspect Produce</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors"
                >
                  Choose Different Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <p className="text-sm font-bold text-stone-900">
                  Drag and drop produce photograph here
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Supports JPG, PNG, WebP up to 10MB
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow transition-all"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Browse File</span>
                </button>

                {/* Mobile Camera Trigger */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Field Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Spinner Area */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-soft flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <Sparkles className="w-5 h-5 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-extrabold text-stone-900 font-display">
              Expert Quality Inspector AI Analyzing...
            </h4>
            <p className="text-xs text-stone-500">
              Assessing skin blemishes, firmness, chromatic uniformity, and market grading.
            </p>
          </div>
        </div>
      )}

      {/* Grade A / B / C Certified Badge Result */}
      {gradeResult && !isLoading && gradeTheme && (
        <div
          className={`bg-gradient-to-br ${gradeTheme.cardBg} rounded-3xl p-6 sm:p-8 border-2 ${gradeTheme.border} shadow-xl relative overflow-hidden transition-all`}
        >
          {/* Top Certification Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl ${gradeTheme.badgeBg} ${gradeTheme.badgeText} flex items-center justify-center shadow-lg text-xl font-black font-display`}
              >
                {gradeResult.grade.replace('Grade ', '')}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase ${gradeTheme.badgeBg} ${gradeTheme.badgeText} shadow-sm`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {gradeTheme.badgeTitle}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-500">
                    {(gradeResult.confidence_score * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 font-display mt-0.5">
                  {gradeResult.crop_identified || 'Produce Evaluation'}
                </h3>
                <p className="text-xs text-stone-500">{gradeTheme.tier}</p>
              </div>
            </div>

            {/* Suggested Market Price Container */}
            <div className="bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 self-start sm:self-auto">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  AI Suggested Price
                </span>
                <span className="text-xl font-black font-mono text-stone-900">
                  ${gradeResult.suggested_price_usd.toFixed(2)}
                  <span className="text-xs font-bold text-stone-500 ml-1">/ KG</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quality Breakdown & Defects Detected */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Defects & Surface Attributes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>Optical Defects & Quality Observations</span>
              </h4>

              <div className="space-y-2">
                {gradeResult.defects_detected.map((defect, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs font-medium text-stone-700 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{defect}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Inspector Summary & Market Action */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-stone-500" />
                  <span>Inspector Official Diagnosis</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed italic">
                  &ldquo;{gradeResult.analysis_summary}&rdquo;
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsListed(true)}
                  disabled={isListed}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isListed
                      ? 'Catalog Listing Updated at $' + gradeResult.suggested_price_usd.toFixed(2) + '/kg'
                      : 'List Produce at $' + gradeResult.suggested_price_usd.toFixed(2) + '/kg'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGrader;

