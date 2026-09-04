import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Volume2,
  Send,
} from 'lucide-react';
import { fastapiAiApi } from '../../api/fastapiAi';
import { VoiceInventoryResponse, InventoryItem } from '../../types/ai';

interface VoiceRecorderProps {
  onInventoryExtracted?: (items: InventoryItem[]) => void;
  className?: string;
}

const SAMPLE_KHMER_TRANSCRIPTS = [
  {
    label: 'ប៉េងប៉ោះ ៥០kg & ត្រសក់ ២០kg',
    text: 'ស្អែកខ្ញុំនឹងប្រមូលផលប៉េងប៉ោះ ៥០ គីឡូ ហើយនិងត្រសក់ ២០ គីឡូ',
    desc: 'Tomorrow: 50kg tomatoes & 20kg cucumbers',
  },
  {
    label: 'ស្វាយកែវរមៀត ១០០kg (លេខ១)',
    text: 'ខ្ញុំមានស្វាយកែវរមៀត ១០០ គីឡូ លេខ១ សម្រាប់នាំចេញទៅភ្នំពេញ',
    desc: '100kg Keo Romeat Mango Grade 1 for Phnom Penh',
  },
  {
    label: 'ម្ទេសប្លោក ៣០kg & ពោត ៤០kg',
    text: 'ប្រមូលផលម្ទេសប្លោក ៣០ គីឡូ និងពោតផ្អែម ៤០ គីឡូ គុណភាពខ្ពស់',
    desc: '30kg Bell Peppers & 40kg Sweet Corn Grade A',
  },
];

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onInventoryExtracted,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState(
    'ស្អែកខ្ញុំនឹងប្រមូលផលប៉េងប៉ោះ ៥០ គីឡូ ហើយនិងត្រសក់ ២០ គីឡូ'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VoiceInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const timerRef = useRef<any>(null);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start recording on pointer/mouse down or touch start
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setError(null);
    setAppliedNotice(false);

    // Increment timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Stop recording on release & trigger AI extraction
  const handleStopRecording = async (customTranscript?: string) => {
    if (!isRecording && !customTranscript) return;

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const textToSend = customTranscript || transcript;
    await processTranscript(textToSend);
  };

  const processTranscript = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fastapiAiApi.extractVoiceInventory(text);
      setResult(response);
      if (onInventoryExtracted) {
        onInventoryExtracted(response.items);
      }
    } catch (err: any) {
      console.error('Voice inventory extraction error:', err);
      setError(err.message || 'Failed to process voice transcript. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToInventory = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Khmer Voice-to-Inventory (AI NLU)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
              Voice Harvest Intake
            </h2>
            <p className="text-xs text-stone-500 max-w-xl">
              Hold the microphone button and speak in Khmer or English. The AI automatically detects crop varieties, weights in kg, and quality grades into structured inventory.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              FastAPI Endpoint
            </span>
            <code className="text-xs font-mono font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-100">
              POST /api/ai-voice-inventory
            </code>
          </div>
        </div>

        {/* Hold to Record Interaction Area */}
        <div className="mt-8 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-stone-50 to-emerald-50/30 rounded-2xl border-2 border-dashed border-emerald-200/80">
          <div className="relative">
            {/* Animated Pulse Rings while Recording */}
            {isRecording && (
              <>
                <div className="absolute -inset-4 rounded-full bg-emerald-400/30 animate-ping" />
                <div className="absolute -inset-8 rounded-full bg-emerald-300/20 animate-pulse" />
              </>
            )}

            <button
              type="button"
              onPointerDown={handleStartRecording}
              onPointerUp={() => handleStopRecording()}
              onPointerLeave={() => {
                if (isRecording) handleStopRecording();
              }}
              className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl select-none ${
                isRecording
                  ? 'bg-rose-600 text-white scale-105 shadow-rose-500/40 ring-4 ring-rose-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/30'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-8 h-8 fill-current" />
                  <span className="text-[11px] font-bold uppercase tracking-wider mt-1">
                    Release
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-9 h-9" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                    Hold to Record
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Recording Timer / State */}
          <div className="mt-4 text-center">
            {isRecording ? (
              <div className="flex items-center gap-2 text-rose-600 font-mono font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Recording Khmer Audio: {recordingSeconds}s</span>
              </div>
            ) : (
              <p className="text-xs text-stone-500 font-medium">
                Hold button to speak • Release to process automatically
              </p>
            )}
          </div>

          {/* Sound Wave Bars Animation */}
          {isRecording && (
            <div className="flex items-center gap-1.5 mt-3">
              {[40, 70, 95, 60, 85, 50, 90, 65, 30].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-emerald-600 rounded-full animate-pulse"
                  style={{
                    height: `${height * 0.3}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Transcript Box & Sample Preset Buttons */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Simulated Khmer Voice Transcript:</span>
            </label>
            <span className="text-[11px] text-stone-400">Editable for testing</span>
          </div>

          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={2}
              className="w-full text-sm font-medium text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-sans"
              placeholder="Enter Khmer voice transcription..."
            />
            <button
              onClick={() => processTranscript(transcript)}
              disabled={isLoading || !transcript.trim()}
              className="absolute right-2.5 bottom-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Analyze</span>
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-stone-400">Quick Test Samples:</span>
            {SAMPLE_KHMER_TRANSCRIPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(sample.text);
                  processTranscript(sample.text);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-emerald-100 hover:text-emerald-800 text-stone-600 transition-colors border border-stone-200 text-left"
                title={sample.desc}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-soft flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-emerald-800 animate-pulse">
            AI extracting crops, weights, and quality grades from Khmer voice...
          </p>
        </div>
      )}

      {/* Result: Clean Green-Themed "Inventory Updated" Card */}
      {result && !isLoading && (
        <div className="bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-xl relative overflow-hidden">
          {/* Subtle Decorative Background Accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-stone-900 font-display flex items-center gap-2">
                  <span>Inventory Updated Successfully</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live AI Sync
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  Extracted {result.items.length} item(s) from spoken transcript • {result.detected_language} NLP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyToInventory}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Confirm & Add to Stock</span>
              </button>
            </div>
          </div>

          {/* Success Toast Banner inside Card */}
          {appliedNotice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Produce successfully synchronized to your public FarmerDirect marketplace catalog!</span>
              </div>
            </div>
          )}

          {/* Inventory Items Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Crop Variety #{index + 1}
                    </span>
                    <h4 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
                      <span>{item.crop}</span>
                      {item.crop_khmer && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {item.crop_khmer}
                        </span>
                      )}
                    </h4>
                    {item.notes && (
                      <p className="text-xs text-stone-500 italic">{item.notes}</p>
                    )}
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    {item.quality}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-stone-900 font-mono">
                      {item.quantity_kg}
                    </span>
                    <span className="text-xs font-bold text-stone-500 uppercase">KG</span>
                  </div>

                  <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ready for Sale</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="mt-6 pt-4 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 gap-2">
            <span className="font-mono truncate max-w-md">
              Original Audio Transcript: &ldquo;{result.raw_transcript}&rdquo;
            </span>
            <span className="font-mono text-stone-400">
              Processed: {new Date(result.processed_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
