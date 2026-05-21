import pandas as pd
import numpy as np
import os
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score

# Setup paths
BASE_DIR = "d:\\Czae dissertation\\czae-credit-scoring"
MODEL_PATH = os.path.join(BASE_DIR, "ml_pipeline\\models\\saved\\random_forest.joblib")
DATA_PATH = os.path.join(BASE_DIR, "data\\processed\\featured_borrowers.csv")
RESULTS_DIR = os.path.join(BASE_DIR, "research\\results")

def run_fairness_analysis():
    print("Loading model and data for fairness analysis...")
    pipeline = joblib.load(MODEL_PATH)
    df = pd.read_csv(DATA_PATH)
    
    X = df.drop(columns=['borrower_id', 'default'])
    y = df['default']
    
    # Predict
    y_pred = pipeline.predict(X)
    df['predicted'] = y_pred
    
    fairness_results = []
    
    groups = {
        'Location': ['Urban', 'Rural'],
        'Employment': ['Formal', 'Informal', 'Self-employed']
    }
    
    for category, labels in groups.items():
        for label in labels:
            col = 'location' if category == 'Location' else 'employment_type'
            sub_df = df[df[col] == label]
            
            if len(sub_df) > 0:
                acc = accuracy_score(sub_df['default'], sub_df['predicted'])
                prec = precision_score(sub_df['default'], sub_df['predicted'], zero_division=0)
                rec = recall_score(sub_df['default'], sub_df['predicted'], zero_division=0)
                
                # False Positive Rate (FPR) - critical for fairness in lending
                # FPR = FP / (FP + TN)
                negatives = sub_df[sub_df['default'] == 0]
                fpr = (negatives['predicted'] == 1).sum() / len(negatives) if len(negatives) > 0 else 0
                
                fairness_results.append({
                    'Category': category,
                    'Group': label,
                    'Sample Size': len(sub_df),
                    'Accuracy': acc,
                    'Precision': prec,
                    'Recall': rec,
                    'FPR': fpr
                })
    
    fairness_df = pd.DataFrame(fairness_results)
    output_path = os.path.join(RESULTS_DIR, "fairness_analysis.csv")
    fairness_df.to_csv(output_path, index=False)
    
    print("\nFairness Analysis Results:")
    print(fairness_df)
    
    # Check for Disparate Impact (FPR ratio)
    rural_fpr = fairness_df[fairness_df['Group'] == 'Rural']['FPR'].values[0]
    urban_fpr = fairness_df[fairness_df['Group'] == 'Urban']['FPR'].values[0]
    
    print(f"\nLocation Disparate Impact Ratio (Rural FPR / Urban FPR): {rural_fpr / (urban_fpr + 1e-6):.2f}")
    
    return fairness_df

if __name__ == "__main__":
    run_fairness_analysis()
