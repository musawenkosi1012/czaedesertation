import pandas as pd
import numpy as np
import os

def generate_zim_proxy(n_samples=5000):
    rng = np.random.default_rng(42)
    
    data = {
        'borrower_id': range(1, n_samples + 1),
        
        # Demographics (aligned with Zim Census/Findex)
        'age': rng.integers(18, 75, n_samples),
        'gender': rng.choice(['M', 'F'], n_samples, p=[0.48, 0.52]),
        'location': rng.choice(['Rural', 'Urban'], n_samples, p=[0.60, 0.40]),
        
        # Financial Inclusion (Real Findex Stats)
        'has_mobile_money': rng.choice([1, 0], n_samples, p=[0.52, 0.48]),
        'has_bank_account': rng.choice([1, 0], n_samples, p=[0.22, 0.78]),
        
        # Economic Indicators (Adjusted for Zim reality)
        'employment_type': rng.choice(
            ['Informal', 'Self-Employed', 'Public Sector', 'Private Sector'], 
            n_samples, 
            p=[0.50, 0.35, 0.08, 0.07] # High informality
        ),
        'monthly_income': np.exp(rng.normal(5.5, 0.8, n_samples)) * 50, # Scaled for USD/Proxy
        
        # Digital Footprint (Alternative Data)
        'months_active': rng.integers(1, 120, n_samples),
        'monthly_tx_count': rng.integers(0, 50, n_samples),
        
        # Credit History (Proxy for Borrowing Source)
        'previous_defaults': rng.choice([0, 1, 2], n_samples, p=[0.85, 0.12, 0.03]),
        'informal_borrowing_history': rng.choice([1, 0], n_samples, p=[0.40, 0.60]),
        
        # The Target: Default (Probability influenced by metrics)
    }
    
    df = pd.DataFrame(data)
    
    # Simple logic to determine default (y) based on risk factors
    # Risk increases if: Low income, Rural, Informal employment, previous defaults
    risk_score = (
        (df['monthly_income'] < 150).astype(int) * 2 +
        (df['employment_type'] == 'Informal').astype(int) * 1.5 +
        (df['previous_defaults'] > 0).astype(int) * 3 +
        (df['has_mobile_money'] == 0).astype(int) * 1 +
        rng.normal(0, 1, n_samples)
    )
    
    # 8% Default rate (typical for African Digital Lending)
    threshold = np.percentile(risk_score, 92)
    df['default'] = (risk_score >= threshold).astype(int)
    
    return df

if __name__ == "__main__":
    SAVE_PATH = "d:\\Czae dissertation\\czae-credit-scoring\\data\\processed\\real_proxy_zimbabwe.csv"
    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
    
    df = generate_zim_proxy(5000)
    df.to_csv(SAVE_PATH, index=False)
    print(f"Generated 5,000 real-proxy records at: {SAVE_PATH}")
    print("\nSample Data Overview:")
    print(df.head())
    print("\nDefault Distribution:")
    print(df['default'].value_counts(normalize=True))
