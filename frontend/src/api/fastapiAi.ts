import {
  VoiceInventoryResponse,
  VisionGradeResponse,
  PredictionsResponse,
  AgriChatResponse,
} from '../types/ai';

// Base URL for the AI Service
// In dev, defaults to http://localhost:8000. In production on Vercel, points to live Render backend.
const getAiBaseUrl = (): string => {
  const customUrl = import.meta.env.VITE_AI_API_URL;
  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://farmer-direct-backend.onrender.com';
  }
  // Default development server host
  return 'http://localhost:8000';
};

const AI_BASE_URL = getAiBaseUrl();

/**
 * Direct API client for FarmerDirect FastAPI AI Service
 */
export const fastapiAiApi = {
  /**
   * 1. Voice-to-Inventory Extractor
   * POST /api/ai-voice-inventory
   */
  async extractVoiceInventory(transcript: string): Promise<VoiceInventoryResponse> {
    const res = await fetch(`${AI_BASE_URL}/api/ai-voice-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to extract voice inventory (${res.status})`);
    }

    return res.json();
  },

  /**
   * 2. Computer Vision Produce Grader
   * POST /api/ai-vision-grade
   */
  async gradeProduceImage(
    fileOrBase64: File | string,
    cropName = 'Produce'
  ): Promise<VisionGradeResponse> {
    const formData = new FormData();
    if (fileOrBase64 instanceof File) {
      formData.append('file', fileOrBase64);
    } else {
      formData.append('image_base64', fileOrBase64);
    }
    formData.append('crop_name', cropName);

    const res = await fetch(`${AI_BASE_URL}/api/ai-vision-grade`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Produce grading failed (${res.status})`);
    }

    return res.json();
  },

  /**
   * 3. Predictive Harvest Recommendations
   * GET /api/predictions
   */
  async getPredictions(): Promise<PredictionsResponse> {
    const res = await fetch(`${AI_BASE_URL}/api/predictions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch predictions (${res.status})`);
    }

    return res.json();
  },

  /**
   * 4. Interactive Agri Advisor Chat (Bonus Feature)
   * POST /api/ai-agri-chat
   */
  async sendAgriChatMessage(message: string, history: Array<{ role: string; content: string }> = []): Promise<AgriChatResponse> {
    const res = await fetch(`${AI_BASE_URL}/api/ai-agri-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversation_history: history }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Chat request failed (${res.status})`);
    }

    return res.json();
  },
};

