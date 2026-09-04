/**
 * FarmerDirect Agri-Tech AI Types
 * Strict TypeScript interfaces for Voice Inventory, Vision Grader, and Harvest Predictions.
 */

export interface InventoryItem {
  crop: string;
  crop_khmer?: string;
  quantity_kg: number;
  quality: 'Grade A' | 'Grade B' | 'Grade C' | string;
  notes?: string;
}

export interface VoiceInventoryResponse {
  status: string;
  items: InventoryItem[];
  raw_transcript: string;
  detected_language: string;
  processed_at: string;
}

export interface VisionGradeResponse {
  grade: 'Grade A' | 'Grade B' | 'Grade C' | 'A' | 'B' | 'C';
  confidence_score: number;
  defects_detected: string[];
  suggested_price_usd: number;
  crop_identified?: string;
  analysis_summary?: string;
  market_tier?: string;
}

export interface WeatherAlert {
  level: 'WARNING' | 'ADVISORY' | 'INFO';
  title: string;
  description: string;
  affected_regions: string[];
}

export interface CropRecommendation {
  crop: string;
  category: string;
  action: 'HARVEST_NOW' | 'DELAY_HARVEST' | 'PLANT_NOW' | 'PROTECT_COVER';
  demand_level: 'HIGH' | 'MODERATE' | 'LOW';
  optimal_window: string;
  price_outlook_usd: string;
  reasoning: string;
}

export interface PredictionsResponse {
  status: string;
  timestamp: string;
  active_season: string;
  monsoon_status: string;
  weather_alerts: WeatherAlert[];
  crop_recommendations: CropRecommendation[];
  soil_advisory: string;
  market_summary: string;
}

export interface AgriChatResponse {
  reply: string;
  suggested_followups: string[];
}

