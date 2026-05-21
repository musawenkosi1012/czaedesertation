# Czae Credit Scoring System - Master Launcher
# This script starts both the FastAPI backend and Next.js frontend

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  CZAE CREDIT SCORING SYSTEM                    ║" -ForegroundColor Cyan
Write-Host "║     ML-powered credit scoring for Zimbabwean digital lending   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "d:\Czae dissertation\czae-credit-scoring"

# Check if venv exists
if (-not (Test-Path "$projectRoot\venv\Scripts\python.exe")) {
    Write-Host "❌ ERROR: Python virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run: cd $projectRoot && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "$projectRoot\frontend\web\node_modules")) {
    Write-Host "❌ ERROR: Node modules not installed!" -ForegroundColor Red
    Write-Host "Please run: cd $projectRoot\frontend\web && npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/2] Starting FastAPI Backend..." -ForegroundColor Yellow
Write-Host "      Location: http://localhost:8000" -ForegroundColor Gray
Start-Process -FilePath "$projectRoot\venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload" `
  -WorkingDirectory $projectRoot `
  -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Next.js Frontend..." -ForegroundColor Yellow
Write-Host "      Location: http://localhost:3000" -ForegroundColor Gray
Start-Process -FilePath "npm" `
  -ArgumentList "run dev" `
  -WorkingDirectory "$projectRoot\frontend\web" `
  -WindowStyle Minimized

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    SYSTEM READY TO USE                         ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  🌐 Web Portal:   http://localhost:3000                        ║" -ForegroundColor Green
Write-Host "║  🔌 Backend API:  http://localhost:8000                        ║" -ForegroundColor Green
Write-Host "║  📚 API Docs:     http://localhost:8000/docs                   ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  Credentials:                                                  ║" -ForegroundColor Green
Write-Host "║  • Username: admin                                             ║" -ForegroundColor Green
Write-Host "║  • Password: czae2026                                          ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  Services will open in separate windows                        ║" -ForegroundColor Green
Write-Host "║  Close the windows to stop the services                        ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✓ All services started successfully!" -ForegroundColor Green
Write-Host "  Next.js may take 30-60 seconds to compile on first run." -ForegroundColor Gray
