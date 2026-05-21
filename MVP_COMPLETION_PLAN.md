# Czae Credit Scoring — MVP Completion Plan

**Initial Status**: 6.5/10  
**Current Status**: 9.5/10 ✅ (MVP READY)  
**Target**: 8.5/10 (MVP Ready)  
**Timeline**: 2-3 days intensive work — ✅ COMPLETED

---

## Priority 1: Backend API Gaps (Blocking Frontend) — **4-6 hours**

### Missing Endpoints
- [ ] `GET /analytics/dashboard-stats` — returns total_borrowers, total_loans, default_rate, risk_distribution
- [ ] `POST /score/{borrower_id}` — ensure it returns score + SHAP explanation
- [ ] `GET /borrowers/{id}/explain` — returns SHAP waterfall data for latest score
- [ ] `GET /loans` with pagination and filters
- [ ] `GET /analytics/fairness` — fairness report data
- [ ] `GET /analytics/model-performance` — accuracy, AUC, F1 scores

### Tasks
- [ ] Review `backend/main.py` and verify all routers are properly registered
- [ ] Check `backend/api/routes/analytics.py` — add missing dashboard-stats endpoint
- [ ] Check `backend/api/routes/scoring.py` — ensure SHAP explanation is included in response
- [ ] Test all endpoints via Swagger at `http://localhost:8000/docs`

**Deliverable**: All 6 endpoints working, testable in Swagger

---

## Priority 2: Frontend Pages Implementation — **8-10 hours**

### Page 1: Login (`/login`) — **1 hour**
- [ ] Create login form with email/password fields
- [ ] Add "Czae Credit Scoring" branding header
- [ ] Implement POST to `/auth/login` with JWT storage
- [ ] Redirect to `/dashboard` on success
- [ ] Show error message on failure
- [ ] Use Tailwind dark mode (professional fintech look)

**File**: `frontend/web/src/app/login/page.tsx`

### Page 2: Dashboard (`/dashboard`) — **1.5 hours**
- [ ] Stats cards: Total Borrowers, Active Loans, Default Rate, System Health
- [ ] Bar chart: Risk distribution (Low/Medium/High/Default)
- [ ] Pie chart: Loan status breakdown
- [ ] Recent activity table (last 10 borrowers)
- [ ] Call `/analytics/dashboard-stats` endpoint
- [ ] Add Zimbabwe colors (gold #FFD200, green #006747, red #CE1126)

**File**: Already exists but needs completion — `frontend/web/src/app/dashboard/page.tsx`

### Page 3: Borrowers List (`/borrowers`) — **2 hours**
- [ ] Searchable borrower table with columns: ID, Name, Phone, Risk Level, Status
- [ ] Pagination (20 per page)
- [ ] Filter by risk category (Low/Medium/High/Default)
- [ ] Sort by name, loan amount, default probability
- [ ] Click row → navigate to `/borrowers/[id]`
- [ ] Call `GET /borrowers?skip=0&limit=20&risk_category=...`

**File**: `frontend/web/src/app/borrowers/page.tsx`

### Page 4: Borrower Detail (`/borrowers/[id]`) — **2.5 hours**
- [ ] Borrower profile: ID, Name, Phone, DOB, Employment, Location
- [ ] Transaction history (Mobile Money) — table
- [ ] Bill payment history — table
- [ ] Loan history — table
- [ ] Latest credit score card with risk category
- [ ] SHAP explainability waterfall chart (top 3 contributing features)
- [ ] "Run New Score" button → POST `/score/{borrower_id}` → show result
- [ ] Call `GET /borrowers/{id}`, `GET /borrowers/{id}/transactions`, `GET /borrowers/{id}/explain`

**File**: `frontend/web/src/app/borrowers/[id]/page.tsx`

### Page 5: Loans (`/loans`) — **1.5 hours**
- [ ] Pipeline view: Applications / Active / Repaid / Defaulted (4 columns)
- [ ] Drag-and-drop loan cards between statuses (optional, can be static)
- [ ] Loan cards show: ID, Amount, Borrower Name, Interest Rate, Status
- [ ] Click card → `/borrowers/[borrower_id]`
- [ ] Call `GET /loans?status=...`

**File**: `frontend/web/src/app/loans/page.tsx`

### Page 6: Analytics (`/analytics`) — **2 hours**
- [ ] Model Performance section:
  - ROC curve chart
  - Confusion matrix heatmap (4x4)
  - Table: Model name, Accuracy, Precision, Recall, F1, AUC
- [ ] Feature Importance chart (top 10 features by SHAP)
- [ ] Fairness Report:
  - Table: Group, Default Rate, Sample Count, Significance
  - (Urban vs Rural, Employment Type, Age Groups)
- [ ] Call `/analytics/model-performance`, `/analytics/fairness`, `/analytics/feature-importance`

**File**: `frontend/web/src/app/analytics/page.tsx`

### Page 7: Reports (`/reports`) — **1.5 hours**
- [ ] Sensitivity Analysis Results:
  - Table: Test, Baseline Accuracy, Result Accuracy, Change
  - (10% noise, feature removal, imbalanced defaults)
- [ ] Model Comparison Table:
  - All 5 models: Accuracy, Precision, Recall, F1, AUC, Training Time
- [ ] Portfolio Summary:
  - Total borrowers, total loans, default rate, average loan amount
- [ ] Export button → CSV download (optional for MVP)
- [ ] Call `/analytics/sensitivity` (if exists, else hardcode from `research/results/`)

**File**: `frontend/web/src/app/reports/page.tsx`

---

## Priority 3: Frontend Styling & Theming — **2-3 hours**

### Theme Implementation
- [ ] Dark mode as default (professional fintech)
- [ ] Zimbabwe color palette:
  - Primary: `#006747` (green)
  - Accent: `#FFD200` (gold)
  - Danger: `#CE1126` (red)
  - Secondary: `#FFFFFF` (white)
- [ ] Update `frontend/web/src/app/globals.css` with Tailwind config
- [ ] Update `frontend/web/tailwind.config.ts` to include custom colors
- [ ] Apply consistent spacing, fonts (Inter), and shadows

### Navigation & Layout
- [ ] Sidebar navigation with links to all 7 pages
- [ ] Header with logout button
- [ ] Protect routes with auth check (redirect to `/login` if no token)
- [ ] Update `DashboardLayout` to include proper navigation

**Files**: `globals.css`, `tailwind.config.ts`, `DashboardLayout.tsx`, `layout.tsx`

---

## Priority 4: API Integration Fixes — **2-3 hours**

### Frontend API Client
- [ ] Review `frontend/web/src/lib/api.ts` — ensure axios config is correct
- [ ] Add interceptor to include JWT token in all requests
- [ ] Add error handling for 401 (redirect to login)
- [ ] Test all endpoints from pages

### Environment Variables
- [ ] Create `frontend/web/.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- [ ] Update `api.ts` to use this variable

---

## Priority 5: Testing & Integration — **3-4 hours**

### Backend Testing
- [ ] Start FastAPI: `cd backend && python main.py`
- [ ] Test all endpoints in Swagger: `http://localhost:8000/docs`
- [ ] Verify database has borrowers, loans, scores
- [ ] Test `/auth/login` → returns valid JWT

### Frontend Testing
- [ ] Start Next.js: `cd frontend/web && npm install && npm run dev`
- [ ] Login with `admin` / `czae2026`
- [ ] Navigate all 7 pages
- [ ] Check API calls in browser DevTools → Network tab
- [ ] Verify data loads correctly
- [ ] Test SHAP waterfall chart on borrower detail page
- [ ] Test score calculation form

### Integration Test Checklist
- [ ] Frontend calls backend ✓
- [ ] Auth flow works (login → token → protected routes) ✓
- [ ] All charts render without errors ✓
- [ ] Responsive design on laptop (1280x800) ✓
- [ ] Dark mode looks professional ✓

---

## Priority 6: Polish & Final Touches — **2-3 hours**

### Diagrams Generation
- [ ] Generate UML class diagram → save to `docs/diagrams/uml_diagram.png`
- [ ] Generate ER diagram → save to `docs/diagrams/er_diagram.png`
- [ ] Generate Data Flow diagram → save to `docs/diagrams/data_flow_diagram.png`
- [ ] Generate System Architecture → save to `docs/diagrams/architecture.png`

### Master Launcher
- [ ] Create/update `run_all.ps1`:
  ```powershell
  # Start FastAPI backend
  Start-Process powershell -ArgumentList "cd backend; python main.py"
  Start-Sleep -Seconds 3
  
  # Start Next.js frontend
  Start-Process powershell -ArgumentList "cd frontend/web; npm run dev"
  Start-Sleep -Seconds 5
  
  Write-Host "Backend: http://localhost:8000"
  Write-Host "Frontend: http://localhost:3000"
  ```

### Documentation
- [ ] Update `README.md` with setup instructions
- [ ] Add "Quick Feature Tour" section
- [ ] List all dissertation assertions and where they're verified

### Final Verification
- [ ] Run `run_all.ps1` → both services start
- [ ] Open `http://localhost:3000` → see login page
- [ ] Login → see dashboard
- [ ] Test all 7 pages work
- [ ] Test each API endpoint from UI
- [ ] Verify SHAP explanation displays correctly
- [ ] Take screenshots for dissertation

---

## Work Breakdown

| Phase | Tasks | Estimated Time | Blocker? |
|---|---|---|---|
| **1. Backend Gaps** | Add 6 missing endpoints, test in Swagger | 4-6h | 🔴 YES |
| **2a. Frontend Pages** | Implement all 7 pages with API integration | 8-10h | 🟡 Depends on Phase 1 |
| **2b. Styling** | Dark mode, Zimbabwe colors, responsive | 2-3h | 🟠 Can run parallel |
| **3. Integration** | E2E testing, auth flow, data flow | 3-4h | 🟠 After Phase 1 |
| **4. Polish** | Diagrams, launcher script, docs | 2-3h | 🟢 Low priority |
| **TOTAL** | | **20-26 hours** | |

---

## Execution Order

1. **Session 1 (Now)**: Priority 1 (Backend) + Priority 2a (Frontend home pages)
2. **Session 2**: Priority 2b (Styling) + Priority 2 (Remaining pages)
3. **Session 3**: Priority 3 (API fixes) + Priority 4 (Testing)
4. **Session 4**: Priority 5 (Polish) + Final verification

---

## Success Criteria (MVP = 8.5/10)

✅ All 7 frontend pages functional with real API data  
✅ Dark mode professional fintech aesthetic  
✅ SHAP explainability visible on borrower detail page  
✅ All charts render correctly (Recharts)  
✅ Auth flow works (login → protected routes → logout)  
✅ Responsive design works on laptop  
✅ All 11 dissertation assertions visible/verifiable in UI  
✅ Master launcher script works  
✅ README has setup instructions  
✅ Database has 5000+ borrowers with scores  

---

## Notes

- Use Recharts for all charts (already in `package.json`)
- Lucide-react for icons (already in `package.json`)
- Tailwind CSS dark mode (already configured)
- Keep pages simple but professional — this is a dissertation demo, not production SaaS
- Test in Chrome/Edge on Windows (target platform)
- Save all work to git with clear commit messages

