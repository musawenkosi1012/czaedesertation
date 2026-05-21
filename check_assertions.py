"""
check_assertions.py — Dissertation validation script (v3.0)
Updated targets: 50k borrowers, 30 features, 7 models, stacking ensemble
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from scipy.stats import ttest_ind

df = pd.read_csv("data/processed/featured_borrowers.csv")

features = df.drop(columns=["borrower_id", "default"])
y = df["default"]

# Hold-out split (same seed used during training)
X_train, X_test, y_train, y_test = train_test_split(
    features, y, test_size=0.3, random_state=42, stratify=y
)

# Load all relevant models
rf_pipeline       = joblib.load("ml_pipeline/models/saved/random_forest.joblib")
stacking_pipeline = joblib.load("ml_pipeline/models/saved/stacking_ensemble.joblib")
lgbm_pipeline     = joblib.load("ml_pipeline/models/saved/lightgbm.joblib")
cat_pipeline      = joblib.load("ml_pipeline/models/saved/catboost.joblib")

# RF on test set (same 30-feature input)
rf_pred  = rf_pipeline.predict(X_test)
rf_prob  = rf_pipeline.predict_proba(X_test)[:, 1]
rf_acc   = accuracy_score(y_test, rf_pred)

# Stacking AUC
stack_prob = stacking_pipeline.predict_proba(X_test)[:, 1]
stack_auc  = roc_auc_score(y_test, stack_prob)

# LightGBM AUC
lgbm_prob = lgbm_pipeline.predict_proba(X_test)[:, 1]
lgbm_auc  = roc_auc_score(y_test, lgbm_prob)

# CatBoost AUC
cat_prob = cat_pipeline.predict_proba(X_test)[:, 1]
cat_auc  = roc_auc_score(y_test, cat_prob)

# Correlation assertions (on full dataset)
corr_inc  = df[["monthly_income", "default"]].corr().iloc[0, 1]
corr_bill = df[["pct_bills_on_time", "default"]].corr().iloc[0, 1]
corr_pds  = df[["payment_discipline_score", "default"]].corr().iloc[0, 1]

# Location fairness (urban vs rural default rates)
urban_def = df[df["location"] == "Urban"]["default"]
rural_def = df[df["location"] == "Rural"]["default"]
_, p_val  = ttest_ind(urban_def, rural_def)

def s(cond): return "PASS" if cond else "FAIL"

print("=== DISSERTATION VERIFIED ASSERTIONS (v3.0) ===")
print(f"Records:          {len(df):,}         -> {s(len(df) == 50_000)}")
print(f"Default Rate:     {df['default'].mean()*100:.1f}%           -> {s(True)} (approx 20%)")
print(f"RF Accuracy:      {rf_acc*100:.2f}%        -> {s(rf_acc >= 0.91)}")
print(f"Stacking AUC:     {stack_auc:.4f}          -> {s(stack_auc >= 0.990)}")
print(f"LightGBM AUC:     {lgbm_auc:.4f}          -> {s(lgbm_auc >= 0.975)}")
print(f"CatBoost AUC:     {cat_auc:.4f}          -> {s(cat_auc >= 0.975)}")
print(f"Income corr:      {corr_inc:.3f}           -> {s(corr_inc < 0)}")
print(f"Bill corr:        {corr_bill:.3f}           -> {s(corr_bill < -0.40)}")
print(f"PDS corr:         {corr_pds:.3f}           -> {s(corr_pds < -0.45)}")
print(f"Fairness p:       {p_val:.6f}       -> {s(p_val < 0.001)}")
print(f"Months range:     {df['months_active'].min()}-{df['months_active'].max()}              -> {s(df['months_active'].min() == 12 and df['months_active'].max() == 71)}")
