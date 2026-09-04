# FarmerDirect AI Full-Stack Concurrent Launcher
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🌾 Starting FarmerDirect Full-Stack AI Services..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start FastAPI in a background window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\fastapi_ai_service'; Write-Host '🚀 Running FastAPI AI Backend on port 8000...' -ForegroundColor Cyan; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Vite Frontend in another background window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '⚡ Running Vite React Frontend on port 5173...' -ForegroundColor Yellow; npm run dev"

Write-Host "Done! Backend running on http://localhost:8000 and Frontend on http://localhost:5173" -ForegroundColor Green
Write-Host "Farmer AI Suite URL: http://localhost:5173/farmer/agri-ai" -ForegroundColor Cyan

