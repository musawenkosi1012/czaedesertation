import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

# Paths
BASE_DIR = "d:\\Czae dissertation\\czae-credit-scoring"
DATA_PATH = os.path.join(BASE_DIR, "data\\processed\\real_proxy_zimbabwe.csv")
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "ml_pipeline\\models\\saved\\random_forest_real.joblib")

def train_on_real_proxy():
    print(f"Loading Real-Proxy data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    X = df.drop(columns=['borrower_id', 'default'])
    y = df['default']
    
    # 90% Develop / 10% Pure Unseen
    X_dev, X_unseen, y_dev, y_unseen = train_test_split(X, y, test_size=0.10, random_state=42, stratify=y)
    
    # Preprocessing
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object']).columns.tolist()
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]), numeric_features),
            ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore'))]), categorical_features)
        ])
    
    # Random Forest Model
    model = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
    
    clf = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])
    
    print("Retraining model on real-world distributions...")
    clf.fit(X_dev, y_dev)
    
    # SAVE THE RETRAINED MODEL
    joblib.dump(clf, MODEL_SAVE_PATH)
    print(f"Retrained model saved to: {MODEL_SAVE_PATH}")
    
    # FINAL TEST ON REAL UNSEEN DATA
    print("\n" + "="*40)
    print("FINAL VALIDATION ON REAL UNSEEN DATA")
    print("="*40)
    y_pred = clf.predict(X_unseen)
    y_prob = clf.predict_proba(X_unseen)[:, 1]
    
    print(classification_report(y_unseen, y_pred))
    print(f"Unseen Data AUC-ROC: {roc_auc_score(y_unseen, y_prob):.4f}")
    
    # Save unseen test results for dissertation report
    unseen_results = pd.DataFrame({'actual': y_unseen, 'predicted': y_pred, 'probability': y_prob})
    unseen_results.to_csv(os.path.join(BASE_DIR, "research\\results\\unseen_real_test_results.csv"), index=False)
    print("Unseen test results saved for dissertation evidence.")

if __name__ == "__main__":
    train_on_real_proxy()
