import pandas as pd
import numpy as np
import os
import joblib
import shap
import matplotlib.pyplot as plt

# Setup paths
BASE_DIR = "d:\\Czae dissertation\\czae-credit-scoring"
MODEL_PATH = os.path.join(BASE_DIR, "ml_pipeline\\models\\saved\\random_forest.joblib")
DATA_PATH = os.path.join(BASE_DIR, "data\\processed\\featured_borrowers.csv")
FIGURES_DIR = os.path.join(BASE_DIR, "research\\figures")

def run_explainability():
    print("Loading model and data for explainability...")
    pipeline = joblib.load(MODEL_PATH)
    df = pd.read_csv(DATA_PATH)
    
    features = df.drop(columns=['borrower_id', 'default'])
    
    # 1. Transform the data
    preprocessor = pipeline.named_steps['preprocessor']
    features_transformed = preprocessor.transform(features)
    
    # If it's a sparse matrix, convert to dense
    if hasattr(features_transformed, "toarray"):
        features_transformed = features_transformed.toarray()
    
    # 2. Get correct feature names
    # Access the transformers
    num_features = preprocessor.transformers_[0][2]
    cat_transformer = preprocessor.transformers_[1][1]
    onehot = cat_transformer.named_steps['onehot']
    cat_features = onehot.get_feature_names_out(preprocessor.transformers_[1][2]).tolist()
    all_feature_names = num_features + cat_features
    
    # 3. Initialize SHAP
    model = pipeline.named_steps['classifier']
    
    # Random Forest classifier
    explainer = shap.TreeExplainer(model)
    
    # Use a subset of data for speed if needed, but let's try all
    # We only take a subset if it's too slow (e.g., 500 samples)
    features_subset = features_transformed[:1000] 
    shap_values = explainer.shap_values(features_subset)
    
    print(f"SHAP Values calculated for 1000 samples. Shape: {np.array(shap_values).shape}")
    
    # Random Forest shap_values is [class0_shap, class1_shap]
    # We want class 1 (Default)
    vals = shap_values[1] if isinstance(shap_values, list) else shap_values
    
    # 4. Summary Plot
    plt.figure(figsize=(10, 8))
    shap.summary_plot(vals, features_subset, feature_names=all_feature_names, show=False)
    plt.title("SHAP Feature Importance (Global)")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "shap_summary.png"))
    plt.close()
    
    # 5. Bar Plot
    plt.figure(figsize=(10, 8))
    shap.summary_plot(vals, features_subset, feature_names=all_feature_names, plot_type="bar", show=False)
    plt.title("Global Feature Importance (SHAP Bar)")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "shap_importance_bar.png"))
    plt.close()
    
    print("Explainability analysis complete. Figures saved.")

if __name__ == "__main__":
    run_explainability()
