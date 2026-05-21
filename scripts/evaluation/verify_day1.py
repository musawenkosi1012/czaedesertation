import pandas as pd
import numpy as np
import os
import sys
from scipy import stats

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

def verify_day1():
    print("--- Day 1 Verification ---")
    csv_path = os.path.join("d:\\Czae dissertation\\czae-credit-scoring\\data\\synthetic", "borrowers.csv")
    
    if not os.path.exists(csv_path):
        print("Error: borrowers.csv not found.")
        return
        
    df = pd.read_csv(csv_path)
    
    print(f"1. Borrower count: {len(df)} (Target: 5000) - {'PASS' if len(df) == 5000 else 'FAIL'}")
    print(f"2. Default rate: {df['default'].mean()*100:.1f}% (Target: 20.0%) - {'PASS' if abs(df['default'].mean() - 0.2) < 0.01 else 'FAIL'}")
    
    # Check correlations from Dissertation Appendix P.1
    print("\nChecking Correlations:")
    
    # income ↔ tx_frequency (r=0.68)
    corr_inc_tx, _ = stats.pearsonr(np.log(df['monthly_income']), df['monthly_tx_count'])
    print(f"3. Income <-> Tx Freq: r={corr_inc_tx:.2f} (Target: 0.68) - {'PASS' if abs(corr_inc_tx - 0.68) < 0.1 else 'FAIL'}")
    
    # bill punctuality ↔ income stability (r=0.54)
    corr_bill_stab, _ = stats.pearsonr(df['pct_bills_on_time'], df['income_stability'])
    print(f"4. Bill Punctuality <-> Inc Stability: r={corr_bill_stab:.2f} (Target: 0.54) - {'PASS' if abs(corr_bill_stab - 0.54) < 0.1 else 'FAIL'}")
    
    # digital engagement ↔ tx_frequency (r=0.51)
    corr_dig_tx, _ = stats.pearsonr(df['months_active'], df['monthly_tx_count'])
    print(f"5. Dig Engagement <-> Tx Freq: r={corr_dig_tx:.2f} (Target: 0.51) - {'PASS' if abs(corr_dig_tx - 0.51) < 0.1 else 'FAIL'}")
    
    # 6. Statistical Significance (T-test) for Urban vs Rural Default rates (Appendix P.2)
    urban_defaults = df[df['location'] == "Urban"]['default']
    rural_defaults = df[df['location'] == "Rural"]['default']
    t_stat, p_val = stats.ttest_ind(urban_defaults, rural_defaults)
    print(f"\n6. Urban/Rural Default T-test: p={p_val:.4f} (Target: p < 0.001) - {'PASS' if p_val < 0.001 else 'FAIL'}")
    
    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_day1()
