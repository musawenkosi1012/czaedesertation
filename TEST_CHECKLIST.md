# Czae Credit Scoring System — MVP Testing Checklist

**Tester**: _____________________  
**Date**: _____________________  
**Test Environment**: Windows 11, Chrome/Edge  

---

## ✅ Pre-Flight Checks

- [ ] Python virtual environment activated (`venv/Scripts/activate`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install` in `frontend/web/`)
- [ ] SQLite database exists (`backend/czae_credit.db`)
- [ ] Synthetic data seeded (5000+ borrowers in database)
- [ ] Trained models exist (`ml_pipeline/models/saved/`)

---

## 🚀 System Launch

- [ ] Run `.\run_all.ps1` → Both services start without errors
- [ ] Backend console shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] Frontend console shows "▲ Next.js ready in X seconds"
- [ ] No port conflicts (8000 and 3000 free)

---

## 🔐 Authentication (Login Page)

### URL: http://localhost:3000/login

- [ ] Login form displays properly (dark theme, Zimbabwe colors)
- [ ] Username field pre-filled with "admin"
- [ ] Password field accepts input (bullets shown)
- [ ] "Sign In" button clickable
- [ ] Error message appears on invalid credentials
- [ ] Correct credentials (`admin` / `czae2026`) work
- [ ] Redirects to `/dashboard` after successful login
- [ ] Token stored in localStorage
- [ ] Can see token in DevTools → Application → LocalStorage

---

## 📊 Dashboard Page

### URL: http://localhost:3000/dashboard (after login)

#### Stats Cards
- [ ] "Total Borrowers" card shows > 5000 ✓
- [ ] "Active Loans" card shows > 5000 ✓
- [ ] "Default Rate" shows percentage (e.g., "20.0%")
- [ ] "System Health" shows "Optimal"
- [ ] Cards have proper icons and Zimbabwe colors

#### Risk Distribution Chart
- [ ] Donut chart displays (not blank)
- [ ] Shows all 4 risk categories (LOW, MEDIUM, HIGH, VERY_HIGH)
- [ ] Colors match Zimbabwe palette:
  - Green (#006747) for LOW
  - Gold (#FFD200) for MEDIUM
  - Orange for HIGH
  - Red (#CE1126) for VERY_HIGH
- [ ] Legend shows under chart

#### Model Health Section
- [ ] "Target Accuracy" progress bar shows 84%
- [ ] "Model Robustness" shows 90%
- [ ] "Fairness (Urban/Rural)" shows 100%

#### API Integration
- [ ] No console errors (DevTools → Console)
- [ ] Network tab shows `GET /analytics/dashboard-stats` → 200 OK
- [ ] Response includes: `total_borrowers`, `total_loans`, `default_rate`, `risk_distribution`

---

## 👥 Borrowers List Page

### URL: http://localhost:3000/borrowers

#### Table Display
- [ ] Borrower table loads with data (not empty)
- [ ] Shows at least 20 borrowers on first load
- [ ] Columns visible: Name, National ID, Location, Employment, Action
- [ ] Borrower names display with initials in avatar circles
- [ ] Location icons (📍) visible
- [ ] Employment type icons (💼) visible

#### Search Functionality
- [ ] Search box accepts input
- [ ] Typing name filters results in real-time
- [ ] Typing ID filters results
- [ ] Case-insensitive search works
- [ ] "No results" message appears for non-existent search

#### Navigation
- [ ] Clicking "View Profile" link navigates to `/borrowers/{id}`
- [ ] URL changes and correct borrower data loads

#### API Integration
- [ ] Network tab shows `GET /borrowers/?skip=0&limit=20` → 200 OK
- [ ] Response contains array of borrower objects with fields: id, name, national_id, location, employment_type

---

## 👤 Borrower Detail Page

### URL: http://localhost:3000/borrowers/{id} (e.g., /borrowers/1)

#### Profile Card (Left Panel)
- [ ] Borrower's initials displayed in large circle
- [ ] Full name displayed
- [ ] National ID shown
- [ ] Phone number with icon
- [ ] Location with map pin icon
- [ ] Employment type with briefcase icon
- [ ] Date of birth displayed correctly

#### Scoring Section (Right Panel) — Before Assessment
- [ ] Message: "No Credit Assessment"
- [ ] "Assess Creditworthiness" button visible and enabled

#### Scoring Flow
- [ ] Click "Assess Creditworthiness" → button shows loading spinner
- [ ] After 2-3 seconds, score card appears with animation
- [ ] Network tab shows `POST /score/{id}` → 200 OK

#### Score Display (After Assessment)
- [ ] Circular score gauge shows (SVG circle with gradient)
- [ ] Score number (300-850) displayed in center
- [ ] Risk category displayed (LOW/MEDIUM/HIGH/VERY_HIGH)
- [ ] Color matches risk:
  - Green for LOW
  - Gold for MEDIUM
  - Red for HIGH/VERY_HIGH
- [ ] Probability of Default shown as percentage
- [ ] System Decision shown (APPROVE or DECLINE)
- [ ] Model version badge shows "Model v1.0.0 (RF)"

#### Key Drivers (Explainability)
- [ ] 3 feature cards displayed (top contributing factors)
- [ ] Each card shows:
  - Feature name (e.g., "pct bills on time")
  - Impact type (Positive or Negative)
  - Visual indicator (green or red dot)
- [ ] Features are realistic (not lorem ipsum)
- [ ] Blue info box explains SHAP values

#### API Integration
- [ ] `GET /borrowers/{id}` returns borrower details
- [ ] `POST /score/{id}` returns score + key_drivers + probability_of_default
- [ ] `GET /score/{id}/latest` retrieves saved score

---

## 💳 Loans Page

### URL: http://localhost:3000/loans

#### Loan Listing
- [ ] Loans table displays with data
- [ ] Shows Loan ID, Borrower, Amount, Duration, Status, Date, Action
- [ ] Loan IDs formatted as #00001, #00002, etc.
- [ ] Amounts show with currency symbol ($)
- [ ] Status badges show correct colors:
  - Green for REPAID
  - Gold for PENDING/APPROVED
  - Red for DEFAULTED
  - Gray for REJECTED

#### Repayment Calculator
- [ ] Three input fields: Amount, Rate, Duration
- [ ] Default values shown (1000, 15%, 90)
- [ ] Monthly installment calculates in real-time
- [ ] Total interest calculates correctly
- [ ] Total repayment calculates correctly
- [ ] Refresh button works

#### Filtering & Search
- [ ] Search box filters by borrower name/ID
- [ ] Status dropdown filters loans:
  - "All Portfolio" shows all
  - "Pending (Draft)" filters
  - "Fully Repaid" filters
  - "Risk: Defaulted" filters
- [ ] Multiple filters work together

#### API Integration
- [ ] `GET /loans/?skip=0&limit=20` → 200 OK
- [ ] `GET /loans/?status=REPAID` filters correctly
- [ ] `GET /loans/tools/repayment-calculator?...` calculates repayment

---

## 📈 Analytics Page

### URL: http://localhost:3000/analytics

#### Model Comparison Table
- [ ] Shows 5 models: Logistic Regression, Random Forest, XGBoost, Neural Network, Ensemble
- [ ] Columns: Model, Accuracy, Precision, Recall, ROC AUC
- [ ] Random Forest shows ~95% accuracy (PASS indicator)
- [ ] Ensemble has best overall performance
- [ ] Numbers are percentages/decimals (not empty)

#### Visualizations Grid
- [ ] 6 plot containers displayed (2 columns, 3 rows)
- [ ] Each container has title and image/placeholder
- [ ] Titles visible:
  - ROC Curves Comparison
  - Feature Correlation Heatmap
  - Confusion Matrix (RF)
  - Dissertation Feature Significance
  - SHAP Global Importance
  - SHAP Importance Bar
- [ ] Images load (or placeholders visible)

#### API Integration
- [ ] `GET /analytics/model-comparison` → 200 OK, returns array of models
- [ ] `GET /analytics/fairness-report` → 200 OK
- [ ] `GET /analytics/feature-importance` → 200 OK (top 10 features)
- [ ] `GET /analytics/verified-assertions` → 200 OK

---

## 📋 Reports Page

### URL: http://localhost:3000/reports

#### Dissertation Assertions Table
- [ ] Shows assertion name, actual value, target, status
- [ ] Multiple assertions visible (≥8)
- [ ] Status badges:
  - Green "PASS" for passing assertions
  - Red "FAIL" for failing assertions (if any)
- [ ] Assertions include:
  - Random Forest Accuracy (should PASS)
  - Income/Default Correlation
  - Urban/Rural Fairness
  - Location Fairness (p-value)

#### Robustness Analysis
- [ ] Shows sensitivity test results
- [ ] Tests visible:
  - "10% Random Noise"
  - "Feature Removal (Tx Count)"
  - "10% Default Rate"
  - "30% Default Rate"
- [ ] Accuracy results shown for each test
- [ ] Status indicators (PASS/FAIL/INFO)

#### Export Button
- [ ] "Export All Data (CSV)" button visible
- [ ] Button clickable (may or may not trigger download in MVP)

#### API Integration
- [ ] `GET /analytics/verified-assertions` → returns assertion data
- [ ] `GET /analytics/sensitivity-analysis` → returns sensitivity tests
- [ ] All data populated (not showing "Loading...")

---

## 🔌 Backend API (Swagger)

### URL: http://localhost:8000/docs

- [ ] Swagger UI loads
- [ ] All route categories visible:
  - Authentication
  - Borrowers
  - Loans
  - Scoring
  - Analytics
- [ ] Each route has proper HTTP method (GET/POST/etc.)
- [ ] Request/response schemas displayed

#### Test API Endpoints (Try it Out)

**1. GET /borrowers/**
- [ ] Click "Try it out"
- [ ] Skip=0, Limit=20
- [ ] Execute → 200 OK, returns array of borrowers

**2. POST /auth/login**
- [ ] Try with username: admin, password: czae2026
- [ ] Execute → 200 OK, returns `{"access_token": "...", "token_type": "bearer"}`

**3. POST /score/1**
- [ ] Requires Bearer token (use token from login)
- [ ] Execute → 200 OK, returns score object with probability_of_default, key_drivers

**4. GET /analytics/dashboard-stats**
- [ ] Requires auth
- [ ] Execute → 200 OK, returns total_borrowers, total_loans, default_rate, risk_distribution

---

## 🎨 UI/UX Quality

### Styling & Theme
- [ ] Dark mode is default (black/dark gray background)
- [ ] Zimbabwe colors visible:
  - Green (#006747) for positive/primary
  - Gold (#FFD200) for accent/secondary
  - Red (#CE1126) for danger/default
- [ ] Consistent spacing and padding
- [ ] Glassmorphism effect visible (semi-transparent cards)
- [ ] Hover states work (buttons change on mouse over)

### Responsiveness
- [ ] Page works at 1280x800 (standard laptop)
- [ ] Resize browser → layout adjusts (grid columns stack on mobile)
- [ ] Text remains readable at all sizes
- [ ] No horizontal scrollbars on normal viewport

### Performance
- [ ] Dashboard loads in < 3 seconds
- [ ] No flashing or layout shift (CLS)
- [ ] Transitions are smooth (not janky)
- [ ] Icons load correctly (Lucide-React)
- [ ] Charts render smoothly

---

## 🔐 Security & Auth

### Session Management
- [ ] Token stored in localStorage after login
- [ ] Logout clears token (if logout button exists)
- [ ] Redirected to login if token invalid
- [ ] Can't access protected pages without token

### API Authentication
- [ ] Requests include `Authorization: Bearer {token}` header
- [ ] DevTools Network tab shows auth header
- [ ] Endpoints without token return 401 Unauthorized

---

## 🐛 Error Handling

### Network Errors
- [ ] If backend offline → shows "Failed to fetch" error
- [ ] Graceful error messages (not cryptic stack traces)
- [ ] Can still interact with UI

### Invalid Input
- [ ] Searching for non-existent borrower → "No results"
- [ ] Filtering loans by status → correct filtering
- [ ] Invalid route → 404 or redirects properly

### API Errors
- [ ] 404 on non-existent borrower → error message
- [ ] 500 errors → shown in console, UI recovers
- [ ] Timeout → request eventually fails gracefully

---

## 📱 Cross-Browser Testing (Optional)

- [ ] Chrome/Chromium: ✓ / ✗ / N/A
- [ ] Edge: ✓ / ✗ / N/A
- [ ] Firefox: ✓ / ✗ / N/A

---

## ✨ Final Verification

### MVP Completion Criteria
- [ ] All 7 pages functional (login, dashboard, borrowers, detail, loans, analytics, reports)
- [ ] Backend API fully integrated with frontend
- [ ] Authentication flow works end-to-end
- [ ] All dissertation assertions visible and validated
- [ ] No critical console errors
- [ ] Professional appearance (dark theme, proper colors)
- [ ] Responsive design works
- [ ] All endpoints return correct data

### Known Limitations (OK for MVP)
- [ ] Mobile view not optimized (laptop-first design)
- [ ] No export to CSV (button exists but non-functional)
- [ ] No email notifications
- [ ] No advanced analytics (just tables/charts from API)
- [ ] No user roles/permissions system

---

## 📝 Test Summary

**Total Test Cases**: 70+  
**Passed**: _____  
**Failed**: _____  
**Skipped**: _____  

**Overall Status**: 
- [ ] ✅ MVP COMPLETE - Ready for demonstration
- [ ] ⚠️ MVP WITH MINOR ISSUES - See notes below
- [ ] ❌ MVP NOT READY - Critical issues found

**Notes / Issues Found:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Tester Signature**: ____________________  
**Date Completed**: ____________________

---

## 🎯 Next Steps (Post-MVP)

- [ ] User acceptance testing with actual lenders
- [ ] Load testing (1000+ concurrent users)
- [ ] Security audit (OWASP Top 10)
- [ ] Mobile app development
- [ ] Real data integration (EcoCash API)
- [ ] Deployment to cloud (AWS, Vercel, etc.)
- [ ] CI/CD pipeline setup
- [ ] 24/7 monitoring and alerting

