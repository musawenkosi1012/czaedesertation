import pandas as pd
import numpy as np
import os
import joblib
from sklearn.metrics import accuracy_score

# Setup paths
BASE_DIR = "d:\\Czae dissertation\\czae-credit-scoring"
MODEL_PATH = os.path.join(BASE_DIR, "ml_pipeline\\models\\saved\\random_forest.joblib")
DATA_PATH = os.path.join(BASE_DIR, "data\\processed\\featured_borrowers.csv")

def run_sensitivity_tests():
    print("Running Sensitivity Tests...")
    pipeline = joblib.load(MODEL_PATH)
    df = pd.read_csv(DATA_PATH)
    
    X = df.drop(columns=['borrower_id', 'default'])
    y = df['default']
    
    # 1. Baseline Performance
    baseline_acc = accuracy_score(y, pipeline.predict(X))
    print(f"Baseline Accuracy: {baseline_acc*100:.2f}%")
    
    # 2. 10% Random Noise Test
    print("Applying 10% random noise to numerical features...")
    X_noisy = X.copy()
    numeric_cols = X_noisy.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        noise = np.random.normal(0, X_noisy[col].std() * 0.1, size=len(X_noisy))
        X_noisy[col] = X_noisy[col] + noise
        
    noisy_acc = accuracy_score(y, pipeline.predict(X_noisy))
    print(f"Accuracy with 10% Noise: {noisy_acc*100:.2f}% (Target: >= 81%) - {'PASS' if noisy_acc >= 0.81 else 'FAIL'}")
    
    # 3. Feature Removal Test (Transaction Frequency)
    print("Testing removal of 'monthly_tx_count'...")
    # Since the model expects the feature, we'll set it to its mean (effectively neutralizing it)
    X_no_tx = X.copy()
    X_no_tx['monthly_tx_count'] = X_no_tx['monthly_tx_count'].mean()
    
    no_tx_acc = accuracy_score(y, pipeline.predict(X_no_tx))
    print(f"Accuracy without Transaction Frequency: {no_tx_acc*100:.2f}% (Target: ~79%) - {'PASS' if abs(no_tx_acc - 0.79) < 0.03 else 'FAIL'}")
    
    # 4. Imbalanced Default Rate Test (Calibration check)
    # We'll sample the data to simulate different default rates
    for rate in [0.1, 0.3]:
        print(f"Testing with {rate*100}% default rate sampling...")
        # Sample to get desired rate
        df_def = df[df['default'] == 1]
        df_rep = df[df['default'] == 0]
        
        target_def_count = int(2000 * rate)
        target_rep_count = 2000 - target_def_count
        
        sample = pd.concat([
            df_def.sample(min(target_def_count, len(df_def))),
            df_rep.sample(min(target_rep_count, len(df_rep)))
        ])
        
        X_sample = sample.drop(columns=['borrower_id', 'default'])
        y_sample = sample['default']
        
        sample_acc = accuracy_score(y_sample, pipeline.predict(X_sample))
        print(f"Accuracy at {rate*100}% default rate: {sample_acc*100:.2f}%")

if __name__ == "__main__":
    run_sensitivity_tests()
