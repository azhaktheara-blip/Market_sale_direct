import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Stethoscope,
  CloudRain,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Compass,
  MapPin,
  Leaf,
  Info,
} from 'lucide-react';
import { aiApi } from '../../api';
import { Button } from '../../components/common/Button';
import { PageTransition } from '../../components/motion/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

export const FarmerAgriIntelligencePage: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'doctor' | 'weather' | 'prices'>('doctor');

  // Tab 1: AI Doctor State
  const [cropName, setCropName] = useState('Organic Tomatoes');
  const [symptomNotes, setSymptomNotes] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Tab 2: Weather Province State
  const [selectedProvince, setSelectedProvince] = useState('Siem Reap');

  // Tab 3: Price Category State
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const provinces = [
    'Siem Reap',
    'Battambang',
    'Kampot',
    'Kandal',
    'Pursat',
    'Mondulkiri',
    'Takeo',
    'Kampong Cham',
    'Phnom Penh',
    'Koh Kong',
    'Preah Vihear',
    'Kratie',
  ];

  // Weather Query
  const { data: weatherData, isLoading: isWeatherLoading, refetch: refetchWeather } = useQuery({
    queryKey: ['agri-weather', selectedProvince],
    queryFn: () => aiApi.getAgriWeather(selectedProvince).then((res) => res.data),
  });

  // Market Prices Query
  const { data: marketData, isLoading: isMarketLoading } = useQuery({
    queryKey: ['market-prices', selectedCategory, selectedProvince],
    queryFn: () =>
      aiApi
        .getMarketPrices({
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          province: selectedProvince,
        })
        .then((res) => res.data),
  });

  // Handle Photo Select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedImagePreview(URL.createObjectURL(file));
    }
  };

  // Run AI Crop Scan
  const handleRunDiagnosis = async () => {
    try {
      setIsDiagnosing(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      formData.append('crop_name', cropName);
      formData.append('notes', symptomNotes);

      const res = await aiApi.diagnoseCrop(formData);
      setDiagnosisResult(res.data);
      toast.success('Diagnostic analysis completed by AI Pathology Engine!', 'Crop Analyzed');
    } catch (err: any) {
      toast.error('Failed to run diagnostic scan. Please try again.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const sampleSymptoms = [
    'Concentric brown rings on lower leaves',
    'White powdery dust on melon leaves',
    'Rapid daytime wilting in hot soil',
    'Post-harvest grey mold on ripe mangoes',
    'Black sunken patch on tomato bottoms',
    'Tiny yellow spots & fine webbing',
  ];

  return (
    <PageTransition className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            AI Agricultural Intelligence Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
            {t('ai.suite_title')}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('ai.suite_sub')}
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('doctor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'doctor'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t('ai.tab_doctor')}</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'weather'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{t('ai.tab_weather')}</span>
          </button>

          <button
            onClick={() => setActiveTab('prices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'prices'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('ai.tab_prices')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI CROP & LEAF DOCTOR (DIAGNOSTICS & SPOILAGE PREVENTION)          */}
      {/* ========================================================================= */}
      {activeTab === 'doctor' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Upload & Symptom Input */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-soft space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-forest-600" />
                  {t('ai.scan_title')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('ai.scan_sub')}
                </p>
              </div>

              {/* Photo Upload Zone */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Crop Photograph
                </label>

                {selectedImagePreview ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-forest-500 bg-stone-100 group">
                    <img
                      src={selectedImagePreview}
                      alt="Crop specimen"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="px-3.5 py-1.5 bg-white text-stone-900 font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-stone-50">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-300 hover:border-forest-500 bg-stone-50/60 hover:bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-2">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-stone-800">
                      Click to upload or take a leaf photo
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      JPEG, PNG, WebP from phone camera
                    </p>
                  </label>
                )}
              </div>

              {/* Crop Name */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('ai.crop_variety')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tomatoes, Keo Romeat Mango, Cucumber, Rice..."
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
                />
              </div>

              {/* Symptom Notes */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t('ai.describe_symptoms')}
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe visual spots, wilting, leaf edges, or post-harvest rotting..."
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
                />
              </div>

              {/* Sample Quick Chips */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Quick Common Symptoms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleSymptoms.map((sym, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSymptomNotes(sym)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-forest-50 text-stone-700 hover:text-forest-800 border border-stone-200 transition-colors text-left"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleRunDiagnosis}
                isLoading={isDiagnosing}
                className="w-full font-bold shadow-soft"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isDiagnosing ? t('ai.diagnosing') : t('ai.run_scan_btn')}
              </Button>
            </div>

            {/* Right Column: Interactive Diagnostic Report */}
            <div className="lg:col-span-7 space-y-6">
              {diagnosisResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Diagnosis Summary Banner */}
                  <div className="bg-gradient-to-r from-forest-800 via-forest-900 to-stone-900 text-white rounded-3xl p-6 sm:p-7 shadow-soft-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-400/30 inline-block mb-1">
                          Diagnostic ID: {diagnosisResult.scan_id}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                          {diagnosisResult.diagnosis.name}
                        </h2>
                      </div>
                      <div className="text-right sm:border-l sm:border-white/15 sm:pl-4">
                        <div className="text-2xl font-black text-emerald-300">
                          {diagnosisResult.diagnosis.confidence}%
                        </div>
                        <span className="text-[10px] uppercase font-bold text-stone-300">
                          Diagnostic Confidence
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <span className="text-stone-400 text-[10px] font-semibold uppercase block">
                          Pathology Type
                        </span>
                        <strong className="text-white font-bold">
                          {diagnosisResult.diagnosis.disease_type}
                        </strong>
                      </div>
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <span className="text-stone-400 text-[10px] font-semibold uppercase block">
                          Severity Level
                        </span>
                        <strong className="text-amber-300 font-bold">
                          {diagnosisResult.diagnosis.severity}
                        </strong>
                      </div>
                      <div className="bg-white/10 p-3 rounded-2xl col-span-2 sm:col-span-1">
                        <span className="text-stone-400 text-[10px] font-semibold uppercase block">
                          Affected Parts
                        </span>
                        <strong className="text-white font-bold truncate block">
                          {diagnosisResult.diagnosis.affected_parts.join(', ')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Why Did It Spoil / Root Cause */}
                  <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-soft space-y-3">
                    <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      {t('ai.root_cause_title')}
                    </h3>
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1.5 leading-relaxed">
                      <p className="font-bold">Biological Trigger:</p>
                      <p>{diagnosisResult.diagnosis.root_cause}</p>
                    </div>
                    <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 space-y-1.5 leading-relaxed">
                      <p className="font-bold text-stone-900">{t('ai.why_spoiled')}</p>
                      <p>{diagnosisResult.diagnosis.why_produce_spoiled}</p>
                    </div>
                  </div>

                  {/* Step-by-Step Organic Remedies */}
                  <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-soft space-y-4">
                    <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      {t('ai.treatment_title')}
                    </h3>

                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {t('ai.immediate_actions')}
                      </p>
                      <div className="space-y-2">
                        {diagnosisResult.diagnosis.immediate_actions.map((act: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {t('ai.organic_remedies')}
                      </p>
                      <div className="space-y-2">
                        {diagnosisResult.diagnosis.organic_remedies.map((rem: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800"
                          >
                            <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <span>{rem}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {t('ai.storage_guidelines')}
                      </p>
                      <div className="space-y-2">
                        {diagnosisResult.diagnosis.prevention_and_storage_tips.map(
                          (tip: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-3 rounded-2xl bg-teal-50/50 border border-teal-100 text-xs text-teal-900"
                            >
                              <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3 flex flex-col items-center justify-center min-h-[380px]">
                  <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mb-1">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    {t('ai.awaiting_scan')}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md">
                    {t('ai.awaiting_scan_sub')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FARM WEATHER & RAIN PREDICTOR                                     */}
      {/* ========================================================================= */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          {/* Province Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200 shadow-soft">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-forest-600" />
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                {t('ai.select_region')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-forest-600"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov} Province
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchWeather()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Real-time Agricultural Warnings */}
          {weatherData?.agri_advisories && weatherData.agri_advisories.length > 0 && (
            <div className="space-y-3">
              {weatherData.agri_advisories.map((adv, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
                    adv.level === 'WARNING'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : adv.level === 'ADVISORY'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      adv.level === 'WARNING'
                        ? 'text-rose-600'
                        : adv.level === 'ADVISORY'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  <div className="text-xs">
                    <h4 className="font-black text-sm">{adv.title}</h4>
                    <p className="mt-0.5 leading-relaxed">{adv.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Day Highlights Card */}
          {weatherData?.current_day && (
            <div className="bg-gradient-to-r from-forest-800 via-forest-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                <div>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-1">
                    Live Agrometeorology • {weatherData.province} Province
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black font-display">
                    {weatherData.current_day.condition_label}
                  </h2>
                  <p className="text-xs text-stone-300 mt-1">
                    Soil Profile: <strong>{weatherData.soil_profile}</strong> • Topography: <strong>{weatherData.elevation_profile}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{weatherData.current_day.icon}</span>
                  <div>
                    <div className="text-3xl font-black">{weatherData.current_day.temp_high}°C</div>
                    <span className="text-xs text-stone-300">
                      Low: {weatherData.current_day.temp_low}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <CloudRain className="w-4 h-4 text-sky-300" />
                    <span>{t('ai.precipitation')}</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {weatherData.current_day.rain_probability}%
                  </p>
                  <span className="text-[10px] text-stone-300">
                    Expected: {weatherData.current_day.rain_amount_mm} mm
                  </span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <Droplets className="w-4 h-4 text-teal-300" />
                    <span>{t('ai.humidity')}</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {weatherData.current_day.humidity_percent}%
                  </p>
                  <span className="text-[10px] text-stone-300">Fungal spore tracking</span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <Wind className="w-4 h-4 text-amber-300" />
                    <span>{t('ai.wind')}</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {weatherData.current_day.wind_speed_kmh} km/h
                  </p>
                  <span className="text-[10px] text-stone-300">Safe for spray operations</span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <Sun className="w-4 h-4 text-yellow-300" />
                    <span>{t('ai.soil_moisture')}</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-300">
                    {weatherData.current_day.soil_moisture}
                  </p>
                  <span className="text-[10px] text-stone-300">
                    UV Index: {weatherData.current_day.uv_index}/12
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Agricultural Forecast Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              {t('ai.forecast_7day')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {weatherData?.weekly_forecast.map((day) => (
                <div
                  key={day.day_index}
                  className={`bg-white rounded-2xl p-3.5 border shadow-2xs text-center space-y-2 ${
                    day.rain_amount_mm > 15
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-stone-200'
                  }`}
                >
                  <span className="text-xs font-black text-stone-900 block truncate">
                    {day.day_name}
                  </span>
                  <span className="text-2xl block">{day.icon}</span>
                  <div>
                    <span className="text-sm font-extrabold text-stone-900">{day.temp_high}°</span>
                    <span className="text-xs text-stone-400 ml-1 font-medium">{day.temp_low}°</span>
                  </div>
                  <div className="pt-1 border-t border-stone-100 text-[10px] text-stone-600 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span>Rain:</span>
                      <strong className="text-sky-700">{day.rain_probability}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vol:</span>
                      <strong>{day.rain_amount_mm}mm</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NATIONWIDE MARKET PRICE RADAR                                      */}
      {/* ========================================================================= */}
      {activeTab === 'prices' && (
        <div className="space-y-6">
          {/* Top Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200 shadow-soft">
            <div>
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Filter Commodity Category:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Fresh Vegetables', 'Tropical Fruits', 'Herbs & Spices', 'Grains & Rice'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-forest-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Arbitrage & Profit Opportunity Cards */}
          {marketData?.farmer_arbitrage_opportunities &&
            marketData.farmer_arbitrage_opportunities.length > 0 && (
              <div className="bg-gradient-to-r from-forest-800 to-teal-900 text-white rounded-3xl p-6 shadow-soft-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-black">
                      $
                    </div>
                    <div>
                      <h3 className="text-base font-black font-display">
                        {t('ai.arbitrage_title')}
                      </h3>
                      <p className="text-xs text-emerald-200">
                        {t('ai.arbitrage_sub')} {selectedProvince}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/30">
                    Live Arbitrage
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {marketData.farmer_arbitrage_opportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white">{opp.commodity}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-black">
                          {opp.percentage_gain}
                        </span>
                      </div>
                      <div className="text-xs text-stone-300 flex items-center justify-between">
                        <span>
                          {opp.origin_province}: ${opp.origin_price.toFixed(2)}
                        </span>
                        <span>
                          ➔ {opp.target_province}:{' '}
                          <strong className="text-emerald-300">${opp.target_price.toFixed(2)}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20 leading-snug">
                        💡 {opp.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Multi-Province Comparison Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                  {t('ai.price_board_title')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('ai.price_board_sub')}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                  <tr>
                    <th className="py-3.5 px-4">Commodity</th>
                    <th className="py-3.5 px-3">Phnom Penh</th>
                    <th className="py-3.5 px-3">Siem Reap</th>
                    <th className="py-3.5 px-3">Battambang</th>
                    <th className="py-3.5 px-3">Kampot</th>
                    <th className="py-3.5 px-3">Kandal</th>
                    <th className="py-3.5 px-3">Mondulkiri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {marketData?.commodities.map((item) => (
                    <tr key={item.commodity} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="font-extrabold text-stone-900 block">
                          {item.commodity}
                        </strong>
                        <span className="text-[10px] text-stone-400">{item.category}</span>
                      </td>

                      {['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampot', 'Kandal', 'Mondulkiri'].map(
                        (prov) => {
                          const pData = item.prices[prov];
                          if (!pData) return <td key={prov} className="py-3 px-3">-</td>;

                          const isUp = pData.change_7d > 0;
                          const isDown = pData.change_7d < 0;

                          return (
                            <td key={prov} className="py-3.5 px-3">
                              <div className="flex items-baseline gap-1">
                                <span className="font-extrabold text-stone-900">
                                  ${pData.price.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-stone-400 lowercase">
                                  /{item.unit}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 mt-0.5">
                                {isUp ? (
                                  <span className="text-[10px] font-bold text-emerald-700 flex items-center">
                                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                    +{pData.change_7d}%
                                  </span>
                                ) : isDown ? (
                                  <span className="text-[10px] font-bold text-rose-600 flex items-center">
                                    <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                                    {pData.change_7d}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-400 font-bold">
                                    0.0%
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};
