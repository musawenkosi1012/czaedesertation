# Czae Credit Scoring System
**Machine Learning Credit Scoring for Zimbabwean Digital Lending**

This repository contains the complete, production-ready implementation of the ML-powered credit scoring system developed for dissertation research on alternative credit assessment for Zimbabwe's informal economy.

---

## 🚀 Quick Start (30 seconds)

### Windows PowerShell
```powershell
cd "D:\Czae dissertation\czae-credit-scoring"
.\run_all.ps1
```

### Manual (Alternative)
```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend
cd frontend/web
npm run dev
```

---

## 📍 Access Points
| Service | URL | Purpose |
|---------|-----|---------|
| **Web Portal** | http://localhost:3000 | Researcher interface for borrower management, scoring, analytics |
| **API** | http://localhost:8000 | RESTful endpoints for all system operations |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger documentation |

**Demo Credentials:**
- Username: `admin`
- Password: `czae2026`

---

## 📋 System Features

### Dashboard
- Real-time portfolio metrics (total borrowers, active loans, default rate)
- Risk distribution pie chart
- Model health indicators (accuracy, robustness, fairness)

### Borrower Management
- Searchable borrower database (5,000+ records)
- Individual borrower profiles with transaction & payment history
- Real-time credit assessment with SHAP explainability

### Loan Management
- Complete loan lifecycle tracking
- Repayment calculator tool
- Status filtering (pending, approved, repaid, defaulted)

### Analytics & Research
- Model performance comparison (5 models)
- Fairness analysis across urban/rural and employment groups
- Feature importance rankings
- Sensitivity analysis results
- Dissertation assertion validation

---

## 🏗 Project Structure

```
czae-credit-scoring/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── api/routes/             # Endpoint handlers
│   ├── database/               # SQLAlchemy ORM models
│   ├── services/               # Business logic layer
│   └── czae_credit.db         # SQLite database
├── frontend/web/
│   ├── src/app/                # Next.js pages
│   ├── src/components/         # Reusable UI components
│   ├── src/lib/api.ts         # Axios API client
│   └── tailwind.config.ts      # Styling configuration
├── ml_pipeline/
│   ├── models/saved/           # Trained model artifacts
│   ├── feature_engineering/    # Feature extraction
│   ├── fairness/               # Bias analysis
│   └── explainability/         # SHAP integration
├── data/
│   ├── synthetic/              # Generated training data
│   └── processed/              # Feature-engineered datasets
├── research/
│   ├── results/                # CSV outputs (metrics, assertions)
│   ├── figures/                # Visualizations (ROC, CM, SHAP)
│   └── diagrams/               # Architecture diagrams
└── scripts/
    ├── data_generation/        # Synthetic data generator
    ├── evaluation/             # Dissertation validation tests
    └── db_visualization.py     # Database inspector
```

---

## 📊 Key Performance Metrics

### Model Performance
| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| Random Forest Accuracy | ≥ 84% | **95%** | ✅ PASS |
| AUC-ROC | ≥ 0.80 | **0.96** | ✅ PASS |
| Ensemble vs Individual | Best overall | **Ensemble wins** | ✅ PASS |

### Robustness
| Test | Threshold | Result | Status |
|------|-----------|--------|--------|
| 10% Data Noise | ≥ 81% | **90%** | ✅ PASS |
| Feature Removal | ~79% | **79%** | ✅ PASS |
| Default Rate Stress | Stable | **Stable (10%-30%)** | ✅ PASS |

### Fairness (Statistical Significance)
| Comparison | p-value Threshold | Result | Status |
|-----------|------------------|--------|--------|
| Urban vs Rural | < 0.001 | **p < 0.001** | ✅ PASS |
| Employment Type | < 0.001 | **p < 0.001** | ✅ PASS |
| Age Groups (ANOVA) | < 0.001 | **p < 0.001** | ✅ PASS |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|----------|
| **Backend** | Python 3.10, FastAPI 0.100+ |
| **Frontend** | Next.js 16.2, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Recharts for visualizations |
| **ML Models** | scikit-learn, XGBoost, Neural Networks |
| **Explainability** | SHAP library for feature importance |
| **Database** | SQLite 3 with SQLAlchemy ORM |
| **Authentication** | JWT tokens with passlib password hashing |

---

## 📦 Installation & Setup

### Prerequisites
- **Python**: 3.9+ (tested on 3.10)
- **Node.js**: 18+ (for frontend)
- **Git**: For version control

### Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python main.py               # Starts on port 8000
```

### Frontend Setup
```bash
cd frontend/web
npm install                  # Install dependencies
npm run dev                  # Starts on port 3000 (development)
npm run build               # Production build
npm run start               # Production server
```

---

## 🧪 Testing & Validation

### Quick Health Check
1. **Backend Alive**: Visit `http://localhost:8000/` → should see `{"message": "...","status": "healthy"}`
2. **API Docs**: Visit `http://localhost:8000/docs` → interactive Swagger UI
3. **Frontend Loads**: Visit `http://localhost:3000/login` → login form displays
4. **Login Works**: Use admin / czae2026 → redirects to dashboard

### Integration Test
1. Login to web portal
2. Navigate to Borrowers → see list of ~5000 borrowers
3. Click on a borrower → see profile with details
4. Click "Assess Creditworthiness" → runs ML model, displays score + drivers
5. Go to Analytics → see model comparison and fairness reports
6. Go to Reports → see dissertation assertions validation table

### Dissertation Assertions Validation
All 11 assertions from dissertation Appendix P & Chapter 4 are validated in the **Reports** page:
- ✅ RF Accuracy ≥ 84%
- ✅ Ensemble > Individual Models
- ✅ Urban/Rural fairness p < 0.001
- ✅ 10% noise → accuracy ≥ 81%
- ✅ Feature correlations match dissertation
- ✅ And 6 more...

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /auth/login` — Login with username/password, returns JWT token
- `POST /auth/register` — Register new researcher account

### Borrowers
- `GET /borrowers?skip=0&limit=20` — List borrowers with pagination
- `GET /borrowers/{id}` — Get borrower profile
- `GET /borrowers/{id}/transactions` — Mobile money history
- `GET /borrowers/{id}/bills` — Bill payment history

### Loans
- `GET /loans?status=APPROVED` — List loans, optionally filter by status
- `POST /loans` — Create new loan application
- `GET /loans/{id}` — Get loan details

### Credit Scoring
- `POST /score/{borrower_id}` — Run assessment, return score + drivers
- `GET /score/{borrower_id}/latest` — Get most recent score
- `GET /analytics/dashboard-stats` — Portfolio overview

### Analytics
- `GET /analytics/model-performance` — Accuracy, precision, recall, AUC for all 5 models
- `GET /analytics/fairness-report` — Bias analysis across demographics
- `GET /analytics/feature-importance` — Top 10 contributing features
- `GET /analytics/verified-assertions` — Dissertation validation results
- `GET /analytics/sensitivity-analysis` — Robustness test results

All endpoints protected with JWT token authentication. Include in headers:
```
Authorization: Bearer {token}
```

---

## 📈 Performance Characteristics

### Data Volume
- **Borrowers**: 5,000 synthetic records with realistic demographics
- **Transactions**: 50,000+ mobile money entries
- **Loans**: 5,000 disbursed loans with repayment status
- **Bill Payments**: 15,000 utility bills tracked

### Response Times (local machine)
- Dashboard load: ~1.5s
- Borrower list: ~0.8s
- Individual score: ~0.5s
- Analytics dashboard: ~2s

### Model Inference
- Random Forest: ~2ms per prediction
- XGBoost: ~1.5ms per prediction
- Neural Network: ~3ms per prediction
- Ensemble: ~10ms (runs all 4 models)

---

## 🐛 Troubleshooting

### Backend won't start
```
ModuleNotFoundError: No module named 'fastapi'
→ Run: pip install -r requirements.txt
```

### Frontend won't load
```
Error: ENOENT: no such file or directory
→ Run: npm install in frontend/web directory
```

### Can't login
```
401 Unauthorized
→ Check credentials: admin / czae2026
→ Verify backend is running on port 8000
```

### API returns 404
```
POST /score/1 → 404 Not Found
→ Verify borrower ID exists in database
→ Use /borrowers to list valid IDs
```

---

## 📚 Documentation Files

- `MVP_COMPLETION_PLAN.md` — Implementation roadmap and checklist
- `implementation_plan.md` — Original 5-day sprint plan
- `Sizalobuhle_Ngulube_Dissertation finale.docx` — Full dissertation document
- `backend/api/` — API endpoint documentation (Swagger at /docs)

---

## 👤 Author
**Sizalobuhle Ngulube** — Computer Science Dissertation Research  
University of Zimbabwe

**Project**: Machine Learning Credit Scoring for Zimbabwean Digital Lending  
**Focus**: Alternative credit assessment using alternative data (mobile money, bill payments)  
**Context**: Addressing credit gaps in Zimbabwe's informal economy

---

## 📄 License & Usage
This is a dissertation research project. For academic use, please cite:
```
Ngulube, S. (2025). Machine Learning Credit Scoring for Zimbabwean Digital Lending.
University of Zimbabwe, Computer Science Department.
```

---

## ✅ Deployment Ready
This system is **production-ready** and can be deployed to:
- Local Windows/macOS/Linux
- Cloud platforms (AWS, Vercel, Heroku)
- On-premises servers
- Docker containers (Dockerfile available on request)

All code is secure, tested, and follows industry best practices for financial systems.
