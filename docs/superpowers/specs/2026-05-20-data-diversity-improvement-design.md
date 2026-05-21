# Data Diversity & Model Fairness Improvement Design
**Date:** 2026-05-20
**Project:** Czae Credit Scoring System
**Author:** Sizalobuhle Ngulube

---

## Problem Statement

The current synthetic data generator (`scripts/data_generation/generate_synthetic_data.py`) assigns the default label based on income tier first, then generates payment behavior to match. This creates a circular dependency where high-income borrowers are pre-labelled as non-defaulters and automatically receive good payment stats. As a result, the model gives high scores to high-salary borrowers even when they have chronic late payments — which is incorrect credit risk behaviour.

---

## Root Causes

1. **Income-first default assignment** — default probability is computed from `economy_levels` before payment behaviour is generated.
2. **No "high income + poor payer" persona** — the generation logic makes this combination statistically impossible.
3. **No composite payment signal** — the three payment features (`pct_bills_on_time`, `avg_days_late`, `repeat_lateness_count`) are separate; income can overwhelm each individually.

---

## Solution Overview

### 1. Persona-Stratified Data Generation (Behaviour-First)

Replace the income-first default logic with 6 explicit borrower personas. Payment behaviour is generated independently per persona, then the default label is assigned based on payment behaviour first, income second.

| Persona | Share | Income Tier | Payment Behaviour | Base Default Rate |
|---|---|---|---|---|
| Formal salaried, disciplined | 25% | High | Excellent | 5% |
| Formal salaried, poor payer | 8% | High | Chronic late | 40% |
| Informal trader, disciplined | 20% | Low–Medium | Good | 15% |
| Seasonal worker | 15% | Irregular | Mixed | 30% |
| Gig / peri-urban | 12% | Low | Mixed | 35% |
| Recovering defaulter | 10% | Low–Medium | Improving | 25% |
| Standard middle income | 10% | Medium | Average | 20% |

### 2. Payment Discipline Score (New Composite Feature)

A new feature `payment_discipline_score` (0–100) is added to `features.py`:

```
payment_discipline_score =
    (pct_bills_on_time × 0.5) +
    ((1 - avg_days_late / 20) × 0.3) +
    ((1 - repeat_lateness_count / 8) × 0.2)
× 100
```

This gives the model one strong, balanced payment signal that income cannot drown out. It will also appear as a top explainability feature in SHAP charts.

### 3. Behaviour-First Default Label Assignment

Default probability formula (replaces current income-only formula):

```
payment_pd      = 1 - (payment_discipline_score / 100)
income_factor   = 0.70 (high) | 0.90 (middle) | 1.20 (low)
base_pd         = clip(payment_pd × income_factor × persona_multiplier, 0, 1)
```

A high-salary borrower with chronic late payments gets `payment_pd ≈ 0.70`, reduced only slightly by income → still a high-risk label.

---

## Files Changed

| File | Change |
|---|---|
| `scripts/data_generation/generate_synthetic_data.py` | Full rewrite of generation logic with 6 personas and behaviour-first default assignment |
| `ml_pipeline/feature_engineering/features.py` | Add `payment_discipline_score` to final feature set |

## Files Triggered (require re-run after changes)

| Script | Purpose |
|---|---|
| `scripts/data_generation/generate_synthetic_data.py` | Regenerate `data/synthetic/borrowers.csv` |
| `backend/database/seeds/seed_db.py` | Reseed SQLite from new CSV |
| `ml_pipeline/feature_engineering/features.py` | Regenerate `data/processed/featured_borrowers.csv` |
| Model training scripts | Retrain all 5 models with new data + feature |

---

## Success Criteria

- High-income borrowers with `pct_bills_on_time < 0.5` receive a score below 500 (high risk)
- `payment_discipline_score` appears in top 3 SHAP features
- All 11 dissertation assertions still pass
- Overall default rate remains at 20%
- Model accuracy remains ≥ 81%
