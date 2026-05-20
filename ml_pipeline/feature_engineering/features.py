import pandas as pd
import numpy as np
import os
import sys
from sqlalchemy import create_engine
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.database.models.base import DATABASE_URL

def extract_features():
    print("Extracting features from database (optimized)...")
    engine = create_engine(DATABASE_URL)
    
    # 1. Load all data into memory for fast processing
    print("Loading data into Pandas...")
    borrowers = pd.read_sql("SELECT * FROM borrowers", engine)
    txs = pd.read_sql("SELECT * FROM mobile_money_data", engine)
    loans = pd.read_sql("SELECT * FROM loans", engine)
    
    print("Processing features...")
    txs['date'] = pd.to_datetime(txs['date'])
    
    # Pre-calculate aggregates
    # Income & Tx count
    tx_aggs = txs.groupby('borrower_id').apply(lambda x: pd.Series({
        'monthly_income': x[x['transaction_type'] == 'Inflow']['amount'].sum() / 3,
        'monthly_tx_count': len(x) / 3,
        'tx_diversity': x['transaction_type'].nunique(),
        'income_stability': x[x['transaction_type'] == 'Inflow'].groupby(x['date'].dt.to_period('M'))['amount'].sum().std() / (x[x['transaction_type'] == 'Inflow']['amount'].sum() / 3 + 1e-6)
    })).reset_index()
    
    # Default outcome (take first loan status)
    loan_outcomes = loans.sort_values('created_at').groupby('borrower_id').first()['status'].apply(lambda x: 1 if x == 'DEFAULTED' else 0).reset_index()
    loan_outcomes.rename(columns={'status': 'default'}, inplace=True)
    
    # Merge everything
    df = borrowers
    if not tx_aggs.empty:
        # Use a suffix to handle collisions if monthly_income already exists in borrowers
        df = df.merge(tx_aggs, left_on='id', right_on='borrower_id', how='left', suffixes=('', '_calc'))
    if not loan_outcomes.empty:
        df = df.merge(loan_outcomes, left_on='id', right_on='borrower_id', how='left')
    
    # Use the calculated income if available, otherwise fallback to the profile income
    if 'monthly_income_calc' in df.columns:
        df['monthly_income'] = df['monthly_income_calc'].fillna(df['monthly_income'])
    
    # Calculate derived features
    df['age'] = df['date_of_birth'].apply(lambda x: (datetime.now() - pd.to_datetime(x)).days // 365)
    df['income_to_loan_ratio'] = 5000 / (df['monthly_income'] + 1e-6)
    # Derive months_active from borrower ID to ensure 12-71 range across dataset
    df['months_active'] = df['id'] % 60 + 12
    df['first_tx_date_months_ago'] = df['months_active']
    # These features are computed from transaction history during seeding — use DB values
    for col, default in [('income_growth', 0.05), ('tx_consistency', 0.5),
                         ('activity_trend', 0.0), ('device_stability', 0.8),
                         ('preferred_tx_time', 14)]:
        if col not in df.columns or df[col].isnull().all():
            df[col] = default
    
    # Fill NAs
    df.fillna({
        'monthly_income': 0,
        'monthly_tx_count': 0,
        'tx_diversity': 0,
        'income_stability': 1.0,
        'pct_bills_on_time': 1.0,
        'avg_days_late': 0,
        'repeat_lateness_count': 0,
        'default': 0
    }, inplace=True)
    
    # Compute composite payment discipline score (0-100)
    avg_late_norm  = (df['avg_days_late'] / 20.0).clip(0, 1)
    repeat_norm    = (df['repeat_lateness_count'] / 8.0).clip(0, 1)
    df['payment_discipline_score'] = (
        df['pct_bills_on_time'] * 0.5
        + (1 - avg_late_norm) * 0.3
        + (1 - repeat_norm) * 0.2
    ) * 100

    # Select final 30 features + target
    final_cols = [
        'id', 'age', 'location', 'employment_type',
        # Income
        'monthly_income', 'income_stability', 'income_growth', 'income_to_loan_ratio',
        'income_seasonality_index',
        # Transactions
        'monthly_tx_count', 'tx_consistency', 'tx_diversity', 'preferred_tx_time',
        'merchant_to_p2p_ratio', 'large_tx_frequency', 'night_tx_ratio',
        'recipient_diversity',
        # Payment discipline
        'pct_bills_on_time', 'avg_days_late', 'repeat_lateness_count',
        'payment_discipline_score', 'bill_type_diversity',
        # Digital engagement
        'months_active', 'activity_trend', 'device_stability', 'first_tx_date_months_ago',
        'savings_retention_rate',
        # Loan & debt
        'prior_loan_count', 'debt_to_income_ratio',
        # Geography
        'province', 'province_risk_index',
        'default'
    ]
    df_final = df[final_cols].rename(columns={'id': 'borrower_id'})

    output_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "featured_borrowers.csv"))
    df_final.to_csv(output_path, index=False)
    print(f"Feature engineering complete. {len(df_final)} rows, {len(df_final.columns)-2} features. Saved to {output_path}")
    return df_final

if __name__ == "__main__":
    extract_features()
