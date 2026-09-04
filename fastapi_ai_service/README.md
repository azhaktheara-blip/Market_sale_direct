# FarmerDirect AI Microservice (FastAPI + React)

FastAPI-powered Agri-Tech AI backend for **FarmerDirect** in Cambodia. Provides voice inventory intake, computer vision produce grading, predictive weather/harvest advisory, and an interactive Cambodian agronomist AI advisor.

---

## 1. Features & Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai-voice-inventory` | Extracts structured JSON inventory (crops, quantities in kg, quality grade) from Khmer voice-to-text transcripts using LLM NLU. |
| `POST` | `/api/ai-vision-grade` | Multi-spectral optical quality inspection using GPT-4o / Gemini Vision. Certifies Grade A/B/C, confidence score, visual defects, and fair USD market price. |
| `GET` | `/api/predictions` | AI predictive harvest recommendations correlating monsoon alerts, soil moisture, and wholesale pricing. |
| `POST` | `/api/ai-agri-chat` | Bilingual Cambodian agricultural extension assistant (FarmBot) for pest management, raised bed soil preparation, and market trends. |
| `GET` | `/docs` | Interactive Swagger API documentation and OpenAPI testing sandbox. |
| `GET` | `/health` | Cluster health check and API key readiness indicator. |

---

## 2. Prerequisites & Installation

In your Python 3.10+ environment:

```bash
cd fastapi_ai_service
pip install -r requirements.txt
```

### Required Packages
- `fastapi>=0.115.0`
- `uvicorn[standard]>=0.30.0`
- `pydantic>=2.9.0`
- `openai>=1.40.0`
- `python-multipart>=0.0.9`
- `python-dotenv>=1.0.1`
- `requests>=2.32.0`

---

## 3. Environment Configuration (`.env`)

Create a `.env` file in `fastapi_ai_service/` (or copy `.env.example`):

```bash
# Server Port
PORT=8000
ENVIRONMENT=development

# Provide EITHER a Gemini API Key OR an OpenAI API Key:
# Google Gemini (Supports free tier and ultra-fast multimodal):
GEMINI_API_KEY=your_gemini_api_key_here

# OR OpenAI (GPT-4o / GPT-4o-mini):
# OPENAI_API_KEY=sk-proj-your_openai_key_here

# Frontend CORS Origin
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://market-sale-direct.vercel.app
```

> **Zero-Breakage Graceful Fallback**: If no API key is provided, the backend automatically engages its Cambodian Khmer agricultural NLP engine and deterministic optical inspector so endpoints never crash during development or offline field testing!

---

## 4. Running Backend & Frontend Concurrently

### Terminal 1: Start the FastAPI AI Backend
```bash
cd fastapi_ai_service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API will be accessible at: `http://localhost:8000`
- Interactive Swagger docs at: `http://localhost:8000/docs`

### Terminal 2: Start the React Frontend
```bash
cd frontend
npm run dev
```
- Frontend application will be accessible at: `http://localhost:5173`
- Access the Farmer AI Dashboard in the app at: `http://localhost:5173/farmer/agri-ai`

