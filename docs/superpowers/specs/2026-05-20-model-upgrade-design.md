# Model Upgrade Design — 10x Broader & More Accurate
**Date:** 2026-05-20
**Project:** Czae Credit Scoring System
**Author:** Sizalobuhle Ngulube

---

## Objective

Upgrade the credit scoring ML pipeline across all three dimensions simultaneously:
1. **Data** — 5,000 → 50,000 synthetic borrowers with geographic and seasonal realism
2. **Features** — 19 → 30 features with 10 new alternative data signals
3. **Models** — 5 → 7 base models, voting ensemble → stacking ensemble

---

## Section 1 — Data Layer

### Scale
- **50,000 borrowers** (10× current)
- Same 6 personas retained, distributed across all 10 Zimbabwe provinces

### Geographic Expansion
Province-specific default risk multipliers based on economic activity:

| Province Tier | Provinces | Default Risk Adjustment |
|---|---|---|
| High activity | Harare, Bulawayo | −15% |
| Medium activity | Masvingo, Mutare, Gweru, Chinhoyi | baseline |
| Low activity | Binga, Chikomba, Hwange, Beit Bridge | +25% |

### Seasonal Economic Patterns
Each borrower assigned a `seasonal_income_index` varying by occupation:
- **Farmers:** income peaks March–May (harvest), drops June–October (off-season)
- **Informal traders:** feast-and-famine tied to school term dates (Jan, May, Sep)
- **Formal salaried:** stable with December bonus spike (+20%)
- **Gig/peri-urban:** random monthly variation ±30%

The 6 persona × 10 province × seasonal pattern matrix produces realistic population-level diversity impossible to achieve with 5,000 borrowers.

---

## Section 2 — Feature Engineering (19 → 30 Features)

### Existing Features (19) — Retained
All current features kept unchanged, including `payment_discipline_score` as primary composite signal.

### New Features (10)

| Feature | Formula / Source | Credit Signal |
|---|---|---|
| `savings_retention_rate` | avg_balance_after / monthly_income | Savings discipline → repayment capacity |
| `bill_type_diversity` | count of distinct bill types paid | Broader obligations → responsibility |
| `merchant_to_p2p_ratio` | merchant_txs / p2p_txs | Productive spend vs informal transfers |
| `large_tx_frequency` | count(tx > 2× avg_monthly_income) | Irregular large flows = instability |
| `night_tx_ratio` | txs after 21:00 / total_txs | Night activity = informal economy stress |
| `income_seasonality_index` | peak_month_income / trough_month_income | Income volatility across seasons |
| `prior_loan_count` | count of prior loans in DB | Thin-file vs experienced borrower |
| `debt_to_income_ratio` | outstanding_debt / monthly_income | Standard credit risk measure |
| `recipient_diversity` | unique recipients per month (avg) | Broad network = economic stability |
| `province_risk_index` | province-level default rate (float) | Geographic risk anchor |
| `province` | categorical string (10 values) | Lets CatBoost learn province patterns directly |

### Feature Count Summary
- Total features: **30** (19 existing + 11 new)
- Numeric: 27
- Categorical: 3 (location, employment_type, province)

---

## Section 3 — Model Architecture

### Base Models (6)
1. **Logistic Regression** — baseline, regulator-interpretable
2. **Random Forest** — primary production model
3. **XGBoost** — high-performance gradient boosting
4. **LightGBM** — faster than XGBoost, better on high-cardinality, 50k-scale data
5. **CatBoost** — native categorical handling (province, employment_type, location)
6. **Neural Network (MLP)** — 3-layer (128→64→32), dropout regularisation

### Stacking Ensemble (Meta-Learner)
Replaces the current voting ensemble.

```
Base layer (6 models trained on training set):
  LR · RF · XGBoost · LightGBM · CatBoost · Neural Network
       ↓  out-of-fold predictions (5-fold cross-validation)
Meta layer:
  Logistic Regression meta-learner (trained on OOF predictions)
       ↓
  Final stacking prediction
```

The meta-learner learns which base models to trust in which feature regions — e.g. CatBoost may dominate for province-heavy decisions, RF for payment behaviour signals.

### Dependencies to Install
```
lightgbm
catboost
```

---

## Section 4 — Updated Assertion Targets

| # | Assertion | Old Target | New Target |
|---|---|---|---|
| 1 | Records | 5,000 | 50,000 |
| 2 | Default rate | 20% | 20% |
| 3 | RF Accuracy | ≥ 83.5% | ≥ 91% |
| 4 | Stacking AUC | ≥ 0.79 | ≥ 0.990 |
| 5 | Income/default corr | < 0 | < 0 |
| 6 | Bills/default corr | < 0 | < −0.40 |
| 7 | Urban/Rural p-value | < 0.001 | < 0.001 |
| 8 | Months range | 12–71 | 12–71 |
| NEW | LightGBM AUC | — | ≥ 0.975 |
| NEW | CatBoost AUC | — | ≥ 0.975 |
| NEW | PDS/default corr | — | < −0.45 |

---

## Files Changed

| File | Change |
|---|---|
| `scripts/data_generation/generate_synthetic_data.py` | Expand to 50,000, add province + seasonal logic |
| `ml_pipeline/feature_engineering/features.py` | Add 10 new features (30 total) |
| `ml_pipeline/models/train_all.py` | Add LightGBM, CatBoost, stacking ensemble |
| `backend/api/routes/scoring.py` | Add new features to `extract_features()` |
| `check_assertions.py` | Update targets and add new assertions |

---

## Success Criteria

- 50,000 borrowers generated and seeded cleanly
- 30 features computed in `featured_borrowers.csv`
- All 7 models trained and saved as `.joblib`
- Stacking ensemble AUC ≥ 0.990
- All assertions pass with updated targets
- Scoring endpoint works with new 30-feature input
- `payment_discipline_score` remains in top 3 SHAP features
