# CLAUDE.md — Czae Credit Scoring System

## Project Overview

ML-powered credit scoring system for Zimbabwean digital lending. Dissertation research by Sizalobuhle Ngulube (University of Zimbabwe). Uses alternative data (mobile money, bill payments) to assess creditworthiness in Zimbabwe's informal economy.

## Running the System

```powershell
# Windows — start everything at once
.\run_all.ps1
```

Or manually:

```bash
# Terminal 1: Backend (port 8000)
cd backend
python main.py

# Terminal 2: Frontend (port 3000)
cd frontend/web
npm run dev
```

**Demo credentials:** `admin` / `czae2026`

## Architecture

| Layer | Tech |
|-------|------|
| Backend | Python 3.10, FastAPI 0.100+ |
| Frontend | Next.js 16.2, React 19, TypeScript |
| Styling | Tailwind CSS 4, Recharts |
| ML | scikit-learn, XGBoost, Neural Networks |
| Explainability | SHAP |
| Database | SQLite 3 + SQLAlchemy ORM |
| Auth | JWT + passlib |

## Key Directories

```
backend/
  main.py                  # FastAPI entry point
  api/routes/              # Route handlers
  database/                # SQLAlchemy models
  services/                # Business logic
  czae_credit.db           # SQLite database

frontend/web/
  src/app/                 # Next.js pages
  src/components/          # Reusable UI components
  src/lib/api.ts           # Axios API client

ml_pipeline/
  models/saved/            # Trained model artifacts
  feature_engineering/     # Feature extraction
  fairness/                # Bias analysis
  explainability/          # SHAP integration

data/
  synthetic/               # Generated training data
  processed/               # Feature-engineered datasets

research/
  results/                 # CSV outputs (metrics, assertions)
  figures/                 # Visualizations (ROC, CM, SHAP)
```

## API Conventions

All endpoints require JWT auth header:
```
Authorization: Bearer {token}
```

Key endpoints:
- `POST /auth/login` — returns JWT token
- `GET /borrowers` — paginated list (`?skip=0&limit=20`)
- `POST /score/{borrower_id}` — run ML assessment + SHAP
- `GET /analytics/model-performance` — all 7 model metrics
- `GET /analytics/verified-assertions` — dissertation validation results

## ML Models

Seven models trained and compared (v3.0, 30 features, 50k borrowers):
1. Logistic Regression — interpretable baseline
2. Random Forest — primary model (≥91% accuracy)
3. XGBoost — gradient boosting
4. Neural Network — MLP 3-layer
5. LightGBM — fast gradient boosting
6. CatBoost — native categorical handling
7. Stacking Ensemble — 6 base models + LR meta-learner (AUC ≥ 0.990)

Scoring endpoint uses the Stacking Ensemble for prediction, Random Forest for SHAP explainability.

## Dissertation Assertions

11 assertions validated in the Reports page (Appendix P & Chapter 4). All passing. Do not break these when modifying the ML pipeline or analytics endpoints.

Current targets (v3.0): 50k records, RF ≥91%, Stacking AUC ≥0.990, LightGBM AUC ≥0.975, CatBoost AUC ≥0.975, bill corr <-0.40, PDS corr <-0.45, urban/rural p<0.001.

## Data

- 50,000 synthetic borrowers (10 Zimbabwe provinces, 6 personas, seasonal patterns)
- 500,000+ mobile money transactions
- 50,000 loans
- 150,000 bill payments

Data lives in `data/synthetic/` and `data/processed/`. The SQLite DB (`backend/czae_credit.db`) is the runtime store.

## Virtual Environment

Python venv is at `venv/` in the project root. Activate before running backend scripts:

```bash
source venv/Scripts/activate   # Git Bash / WSL
.\venv\Scripts\activate        # PowerShell
```

## Common Issues

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: fastapi` | `pip install -r requirements.txt` |
| Frontend ENOENT | `npm install` in `frontend/web/` |
| 401 Unauthorized | Check credentials: `admin` / `czae2026` |
| 404 on `/score/{id}` | Verify borrower ID exists via `GET /borrowers` |
