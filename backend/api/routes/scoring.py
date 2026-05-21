from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated, Optional
from sqlalchemy.orm import Session
import joblib
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from datetime import datetime, timezone
from ...database.models.base import get_db
from ...database.models.models import Borrower, CreditScore, RiskCategory, MobileMoneyTransaction
from ..schemas.schemas import ScoringResult
from .auth import get_current_user

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent.parent.parent
rf_pipeline = joblib.load(BASE_DIR / "ml_pipeline/models/saved/random_forest.joblib")
stacking_pipeline = joblib.load(BASE_DIR / "ml_pipeline/models/saved/stacking_ensemble.joblib")
scoring_pipeline = joblib.load(BASE_DIR / "ml_pipeline/models/saved/voting_ensemble.joblib")

_PROVINCE_RISK = {
    "Harare": 0.85, "Bulawayo": 0.87, "Masvingo": 1.00, "Mutare": 1.00,
    "Gweru": 1.00, "Chinhoyi": 1.00, "Binga": 1.25, "Chikomba": 1.25,
    "Hwange": 1.25, "Beit Bridge": 1.25,
}

# Pre-build SHAP explainer once at startup (RF supports fast TreeExplainer)
_rf_preprocessor = rf_pipeline.named_steps["preprocessor"]
_shap_explainer = shap.TreeExplainer(rf_pipeline.named_steps["classifier"])
_transformed_feature_names = [
    n.split("__", 1)[-1] for n in _rf_preprocessor.get_feature_names_out()
]

FEATURE_LABELS = {
    # Income
    "age": "Applicant Age",
    "monthly_income": "Monthly Income",
    "income_stability": "Income Stability",
    "income_growth": "Income Growth Trend",
    "income_to_loan_ratio": "Income-to-Loan Ratio",
    "income_seasonality_index": "Income Seasonality Index",
    # Transactions
    "monthly_tx_count": "Monthly Transaction Count",
    "tx_consistency": "Transaction Consistency",
    "tx_diversity": "Transaction Type Diversity",
    "preferred_tx_time": "Preferred Tx Hour",
    "merchant_to_p2p_ratio": "Merchant vs P2P Spend Ratio",
    "large_tx_frequency": "Large Transaction Frequency",
    "night_tx_ratio": "Night Transaction Ratio",
    "recipient_diversity": "Recipient Diversity",
    # Payment discipline
    "pct_bills_on_time": "Bill Payment Rate",
    "avg_days_late": "Avg Days Late on Bills",
    "repeat_lateness_count": "Repeat Late Payments",
    "payment_discipline_score": "Payment Discipline Score",
    "bill_type_diversity": "Bill Type Diversity",
    # Digital engagement
    "months_active": "Months Active",
    "activity_trend": "Activity Trend",
    "device_stability": "Device Stability",
    "first_tx_date_months_ago": "Account Age (months)",
    "savings_retention_rate": "Savings Retention Rate",
    # Loan & debt
    "prior_loan_count": "Prior Loan Count",
    "debt_to_income_ratio": "Debt-to-Income Ratio",
    # Geography
    "province": "Province",
    "province_risk_index": "Province Risk Index",
}

IMPROVABLE_FEATURES = {
    "pct_bills_on_time": 1.0,
    "avg_days_late": 0.0,
    "income_stability": 1.0,
    "tx_consistency": 1.0,
    "repeat_lateness_count": 0.0,
    "device_stability": 1.0,
}


def calculate_credit_score(prob_default: float) -> int:
    # Log-odds mapping: credit scores are approximately linear in log-odds of default.
    # Calibrated for Zimbabwe fintech (20% base default rate):
    #   PD ~6%  (median borrower) → ~750  LOW/MEDIUM boundary
    #   PD ~16% (moderate risk)   → ~650  MEDIUM/HIGH boundary
    #   PD ~37% (high risk)       → ~550  HIGH/VERY_HIGH boundary
    #   PD ~90% (near-certain)    → ~300  floor
    pd = max(1e-6, min(1 - 1e-6, prob_default))
    log_odds = np.log((1.0 - pd) / pd)
    score = 500 + 91 * log_odds
    return int(max(300, min(850, round(score))))


def get_risk_category(score: int) -> RiskCategory:
    if score >= 750: return RiskCategory.LOW
    if score >= 650: return RiskCategory.MEDIUM
    if score >= 550: return RiskCategory.HIGH
    return RiskCategory.VERY_HIGH


def extract_features(borrower: Borrower, db: Session) -> pd.DataFrame:
    age = (datetime.now() - borrower.date_of_birth).days // 365 if borrower.date_of_birth else 35
    income = float(borrower.monthly_income or 0)
    months = int(borrower.months_active or 12)

    # Compute tx_diversity and preferred_tx_time from actual transactions
    txs = db.query(MobileMoneyTransaction).filter(
        MobileMoneyTransaction.borrower_id == borrower.id
    ).all()
    tx_diversity = len({tx.transaction_type for tx in txs}) if txs else 2
    if txs and any(tx.date for tx in txs):
        from collections import Counter
        hours = [tx.date.hour for tx in txs if tx.date]
        preferred_tx_time = Counter(hours).most_common(1)[0][0] if hours else 14
    else:
        preferred_tx_time = 14

    pct_on_time   = float(1.0 if borrower.pct_bills_on_time is None else borrower.pct_bills_on_time)
    avg_late      = float(0 if borrower.avg_days_late is None else borrower.avg_days_late)
    repeat_late   = float(0 if borrower.repeat_lateness_count is None else borrower.repeat_lateness_count)
    avg_late_norm = min(avg_late / 20.0, 1.0)
    repeat_norm   = min(repeat_late / 8.0, 1.0)
    pds = (pct_on_time * 0.5 + (1 - avg_late_norm) * 0.3 + (1 - repeat_norm) * 0.2) * 100

    province = borrower.province or "Harare"
    province_risk = float(borrower.province_risk_index or _PROVINCE_RISK.get(province, 1.00))

    return pd.DataFrame([{
        # Identity / demographic
        "age": age,
        "location": borrower.location,
        "employment_type": borrower.employment_type,
        # Income
        "monthly_income": income,
        "income_stability": float(borrower.income_stability or 0.5),
        "income_growth": float(borrower.income_growth or 0.0),
        "income_to_loan_ratio": 5000.0 / (income + 1e-6),
        "income_seasonality_index": float(borrower.income_seasonality_index or 1.10),
        # Transactions
        "monthly_tx_count": float(borrower.monthly_tx_count or 0),
        "tx_consistency": float(borrower.tx_consistency or 0.5),
        "tx_diversity": tx_diversity,
        "preferred_tx_time": preferred_tx_time,
        "merchant_to_p2p_ratio": float(borrower.merchant_to_p2p_ratio or 0.50),
        "large_tx_frequency": int(borrower.large_tx_frequency or 1),
        "night_tx_ratio": float(borrower.night_tx_ratio or 0.10),
        "recipient_diversity": int(borrower.recipient_diversity or 5),
        # Payment discipline
        "pct_bills_on_time": pct_on_time,
        "avg_days_late": avg_late,
        "repeat_lateness_count": repeat_late,
        "payment_discipline_score": round(pds, 2),
        "bill_type_diversity": int(borrower.bill_type_diversity or 2),
        # Digital engagement
        "months_active": months,
        "activity_trend": float(borrower.activity_trend or 0.0),
        "device_stability": float(borrower.device_stability or 0.8),
        "first_tx_date_months_ago": months,
        "savings_retention_rate": float(borrower.savings_retention_rate or 0.20),
        # Loan & debt
        "prior_loan_count": int(borrower.prior_loan_count or 0),
        "debt_to_income_ratio": float(borrower.debt_to_income_ratio or 0.50),
        # Geography
        "province": province,
        "province_risk_index": province_risk,
    }])


def compute_shap_drivers(X: pd.DataFrame, prob_default: float = 0.5) -> list:
    """Run SHAP on the RF model and return top-4 features with score-aware sorting.

    Sort logic:
      PD > 0.30  → show biggest RISK factors first (positive SHAP = hurting borrower)
      PD < 0.20  → show biggest PROTECTIVE factors first (negative SHAP = helping borrower)
      0.20–0.30  → 2 risk + 2 protective (balanced view)
    """
    X_t = _rf_preprocessor.transform(X)
    if hasattr(X_t, "toarray"):
        X_t = X_t.toarray()

    shap_vals = _shap_explainer.shap_values(X_t)
    if isinstance(shap_vals, list):
        sv = shap_vals[1][0]
    elif shap_vals.ndim == 3:
        sv = shap_vals[0, :, 1]
    else:
        sv = shap_vals[0]

    def make_driver(idx):
        raw_name = _transformed_feature_names[idx]
        base = raw_name.split("_")[0] if any(
            raw_name.startswith(f) for f in FEATURE_LABELS
        ) else raw_name
        label = FEATURE_LABELS.get(base, FEATURE_LABELS.get(raw_name, raw_name.replace("_", " ").title()))
        return {
            "feature": raw_name,
            "label": label,
            "impact": "Positive" if sv[idx] < 0 else "Negative",
            "shap_value": round(float(sv[idx]), 4),
        }

    if prob_default > 0.30:
        # High risk: lead with what's HURTING the borrower (positive SHAP = increases PD)
        top_idx = np.argsort(sv)[::-1][:4]
    elif prob_default < 0.20:
        # Low risk: lead with what's PROTECTING the borrower (negative SHAP = decreases PD)
        top_idx = np.argsort(sv)[:4]
    else:
        # Borderline: show 2 risk drivers + 2 protective drivers
        risk_idx      = np.argsort(sv)[::-1][:2]   # top 2 positive SHAP (risk)
        protective_idx = np.argsort(sv)[:2]          # top 2 negative SHAP (protective)
        top_idx = np.concatenate([risk_idx, protective_idx])

    return [make_driver(i) for i in top_idx]


def compute_improvement_tips(borrower: Borrower, X: pd.DataFrame, current_pd: float) -> list:
    """Simulate score with each improvable feature set to ideal; return gains."""
    tips = []
    current_score = calculate_credit_score(current_pd)

    for feature, ideal_val in IMPROVABLE_FEATURES.items():
        current_val = X[feature].values[0]
        if abs(float(current_val) - ideal_val) < 0.05:
            continue  # already near-ideal, skip

        X_sim = X.copy()
        X_sim[feature] = ideal_val
        sim_pd = float(scoring_pipeline.predict_proba(X_sim)[0][1])
        sim_score = calculate_credit_score(sim_pd)
        gain = sim_score - current_score

        if gain >= 5:
            label = FEATURE_LABELS.get(feature, feature.replace("_", " ").title())
            if feature == "pct_bills_on_time":
                action = f"Pay all bills on time (currently {current_val*100:.0f}%)"
            elif feature == "avg_days_late":
                action = f"Eliminate late bill payments (avg {current_val:.1f} days late)"
            elif feature == "repeat_lateness_count":
                action = f"Stop repeat late payments ({int(current_val)} occurrences)"
            elif feature == "income_stability":
                action = f"Stabilise monthly income (currently {current_val*100:.0f}% stable)"
            elif feature == "tx_consistency":
                action = f"Maintain consistent mobile money activity"
            else:
                action = f"Improve {label.lower()}"

            tips.append({
                "feature": feature,
                "label": label,
                "action": action,
                "score_gain": gain,
                "pd_reduction_pct": round((current_pd - sim_pd) * 100, 1),
            })

    tips.sort(key=lambda x: x["score_gain"], reverse=True)
    return tips[:3]


def compute_peer_percentile(score: int, borrower_id: int, db: Session) -> float:
    """Return what % of borrowers this score beats (using latest score per borrower)."""
    rows = db.query(CreditScore.borrower_id, CreditScore.score).all()
    if not rows:
        return 50.0
    # Latest score per borrower
    latest = {}
    for bid, s in rows:
        if bid not in latest or s > latest[bid]:
            latest[bid] = s
    scores = list(latest.values())
    below = sum(1 for s in scores if s < score)
    return round(below / len(scores) * 100, 1)


def get_score_delta(borrower_id: int, current_score: int, db: Session) -> Optional[int]:
    prev = (
        db.query(CreditScore)
        .filter(CreditScore.borrower_id == borrower_id)
        .order_by(CreditScore.timestamp.desc())
        .offset(1)
        .first()
    )
    return (current_score - prev.score) if prev else None


@router.post(
    "/{borrower_id}",
    response_model=ScoringResult,
    responses={404: {"description": "Borrower not found"}},
)
async def score_borrower(
    borrower_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[str, Depends(get_current_user)],
):
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")

    X = extract_features(borrower, db)

    # Voting ensemble for scoring (well-calibrated probabilities, good score spread)
    prob_default = float(scoring_pipeline.predict_proba(X)[0][1])
    score = calculate_credit_score(prob_default)
    risk_cat = get_risk_category(score)
    decision = "APPROVE" if risk_cat in [RiskCategory.LOW, RiskCategory.MEDIUM] else "DECLINE"

    # Real SHAP explanation from RF (same training data, fast TreeExplainer)
    key_drivers = compute_shap_drivers(X, prob_default)

    # Improvement simulation
    improvement_tips = compute_improvement_tips(borrower, X, prob_default)

    # Save to DB first so we can compute delta correctly
    db_score = CreditScore(
        borrower_id=borrower_id,
        score=score,
        risk_category=risk_cat,
        probability_of_default=prob_default,
        model_version="3.0.0",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(db_score)
    db.commit()

    peer_pct = compute_peer_percentile(score, borrower_id, db)
    delta = get_score_delta(borrower_id, score, db)

    return ScoringResult(
        borrower_id=borrower_id,
        score=score,
        probability_of_default=prob_default,
        risk_category=risk_cat,
        decision=decision,
        key_drivers=key_drivers,
        timestamp=db_score.timestamp,
        peer_percentile=peer_pct,
        score_delta=delta,
        improvement_tips=improvement_tips,
    )


@router.get(
    "/{borrower_id}/latest",
    response_model=ScoringResult,
    responses={404: {"description": "No score found for this borrower"}},
)
async def get_latest_score(
    borrower_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[str, Depends(get_current_user)],
):
    db_score = (
        db.query(CreditScore)
        .filter(CreditScore.borrower_id == borrower_id)
        .order_by(CreditScore.timestamp.desc())
        .first()
    )
    if not db_score:
        raise HTTPException(status_code=404, detail="No score found for this borrower")

    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    X = extract_features(borrower, db) if borrower else None

    key_drivers = compute_shap_drivers(X, db_score.probability_of_default) if X is not None else []
    improvement_tips = compute_improvement_tips(borrower, X, db_score.probability_of_default) if X is not None else []
    peer_pct = compute_peer_percentile(db_score.score, borrower_id, db)
    delta = get_score_delta(borrower_id, db_score.score, db)

    return ScoringResult(
        borrower_id=db_score.borrower_id,
        score=db_score.score,
        probability_of_default=db_score.probability_of_default,
        risk_category=db_score.risk_category,
        decision="APPROVE" if db_score.risk_category in [RiskCategory.LOW, RiskCategory.MEDIUM] else "DECLINE",
        key_drivers=key_drivers,
        timestamp=db_score.timestamp,
        peer_percentile=peer_pct,
        score_delta=delta,
        improvement_tips=improvement_tips,
    )


@router.post("/tools/simulate")
async def simulate_score(
    features: dict,
    current_user: Annotated[str, Depends(get_current_user)],
):
    expected_cols = [
        "age", "location", "employment_type",
        "monthly_income", "income_stability", "income_growth", "income_to_loan_ratio",
        "income_seasonality_index",
        "monthly_tx_count", "tx_consistency", "tx_diversity", "preferred_tx_time",
        "merchant_to_p2p_ratio", "large_tx_frequency", "night_tx_ratio", "recipient_diversity",
        "pct_bills_on_time", "avg_days_late", "repeat_lateness_count",
        "payment_discipline_score", "bill_type_diversity",
        "months_active", "activity_trend", "device_stability", "first_tx_date_months_ago",
        "savings_retention_rate",
        "prior_loan_count", "debt_to_income_ratio",
        "province", "province_risk_index",
    ]
    df_sim = pd.DataFrame([features])
    for col in expected_cols:
        if col not in df_sim.columns:
            df_sim[col] = 0
    X = df_sim[expected_cols]

    prob_default = float(scoring_pipeline.predict_proba(X)[0][1])
    score = calculate_credit_score(prob_default)
    risk_cat = get_risk_category(score)
    shap_drivers = compute_shap_drivers(X)

    return {
        "score": score,
        "probability_of_default": round(prob_default, 4),
        "risk_category": risk_cat.name,
        "key_drivers": shap_drivers,
        "impact": "SIMULATED",
    }
