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
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Setup paths
BASE_DIR = "d:\\Czae dissertation\\czae-credit-scoring"
DATA_PATH = os.path.join(BASE_DIR, "data\\processed\\featured_borrowers.csv")
MODEL_SAVE_DIR = os.path.join(BASE_DIR, "ml_pipeline\\models\\saved")

def train_best_model():
    df = pd.read_csv(DATA_PATH)
    
    # 1. Feature Engineering (Log transform income)
    df['log_income'] = np.log1p(df['monthly_income'])
    
    X = df.drop(columns=['borrower_id', 'default'])
    y = df['default']
    
    # Preprocessing
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object']).columns.tolist()
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]), numeric_features),
            ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore'))]), categorical_features)
        ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    
    # Using stronger parameters for Random Forest to hit ~84%
    model = RandomForestClassifier(
        n_estimators=200, 
        max_depth=15, 
        min_samples_leaf=2,
        class_weight='balanced', 
        random_state=42
    )
    
    clf = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    print(f"Random Forest Accuracy: {acc*100:.2f}%")
    print(f"ROC AUC: {auc:.2f}")
    
    # Save the best model
    joblib.dump(clf, os.path.join(MODEL_SAVE_DIR, "random_forest.joblib"))
    
    return clf

if __name__ == "__main__":
    train_best_model()
