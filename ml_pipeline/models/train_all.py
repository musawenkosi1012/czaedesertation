import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, StackingClassifier
from xgboost import XGBClassifier
from sklearn.neural_network import MLPClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve

# Setup paths
BASE_DIR = "d:\\Czae dissertation\\czae-credit-scoring"
DATA_PATH = os.path.join(BASE_DIR, "data\\processed\\featured_borrowers.csv")
MODEL_SAVE_DIR = os.path.join(BASE_DIR, "ml_pipeline\\models\\saved")
FIGURES_DIR = os.path.join(BASE_DIR, "research\\figures")

os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
os.makedirs(FIGURES_DIR, exist_ok=True)

def train_and_evaluate():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    
    X = df.drop(columns=['borrower_id', 'default'])
    y = df['default']
    
    # Identify numeric and categorical columns
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object']).columns.tolist()
    
    # Preprocessing pipeline
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # 70/30 Split
    x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    
    # ADDING CLASS WEIGHTS to handle imbalance (20% default rate)
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, class_weight='balanced'),
        'Random Forest': RandomForestClassifier(
            n_estimators=100,
            max_features='sqrt',
            min_samples_leaf=5,
            random_state=42,
            class_weight='balanced'
        ),
        'XGBoost': XGBClassifier(
            use_label_encoder=False, 
            eval_metric='logloss', 
            random_state=42,
            scale_pos_weight=4 # 80/20 ratio = 4
        ),
        'Neural Network': MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1000, random_state=42),
        'LightGBM': LGBMClassifier(
            n_estimators=500,
            learning_rate=0.05,
            num_leaves=63,
            max_depth=7,
            min_child_samples=20,
            class_weight='balanced',
            random_state=42,
            verbose=-1,
        ),
        'CatBoost': CatBoostClassifier(
            iterations=500,
            learning_rate=0.05,
            depth=6,
            auto_class_weights='Balanced',
            random_state=42,
            verbose=0,
        ),
        'Stacking Ensemble': 'stacking',  # built separately below
    }
    
    results = []
    plt.figure(figsize=(10, 8))
    
    for name, model in models.items():
        if model == 'stacking':
            continue
        print(f"Training {name}...")
        clf = Pipeline(steps=[('preprocessor', preprocessor),
                              ('classifier', model)],
                       memory=None)
        
        # Fit
        clf.fit(x_train, y_train)
        y_pred = clf.predict(x_test)
        y_prob = clf.predict_proba(x_test)[:, 1]
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        
        results.append({
            'Model': name,
            'Test Accuracy': acc,
            'Precision': prec,
            'Recall': rec,
            'F1': f1,
            'AUC': auc
        })
        
        # Save model
        joblib.dump(clf, os.path.join(MODEL_SAVE_DIR, f"{name.lower().replace(' ', '_')}.joblib"))
        
        # ROC Curve
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        plt.plot(fpr, tpr, label=f'{name} (AUC = {auc:.2f})')
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(6, 4))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title(f'Confusion Matrix: {name}')
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        plt.savefig(os.path.join(FIGURES_DIR, f"cm_{name.lower().replace(' ', '_')}.png"))
        plt.close()

    # ── Stacking Ensemble ────────────────────────────────────────────────────
    print("Training Stacking Ensemble (5-fold CV, takes longer)...")
    base_estimators = [
        ('lr',   Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced'))])),
        ('rf',   Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', RandomForestClassifier(n_estimators=300, class_weight='balanced', random_state=42, n_jobs=-1))])),
        ('xgb',  Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', XGBClassifier(n_estimators=300, eval_metric='logloss', random_state=42))])),
        ('lgbm', Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', LGBMClassifier(n_estimators=300, num_leaves=63, class_weight='balanced', random_state=42, verbose=-1))])),
        ('cat',  Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', CatBoostClassifier(iterations=300, depth=6, auto_class_weights='Balanced', random_state=42, verbose=0))])),
        ('nn',   Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', MLPClassifier(hidden_layer_sizes=(128, 64, 32), max_iter=300, random_state=42))])),
    ]
    stacking_clf = StackingClassifier(
        estimators=base_estimators,
        final_estimator=LogisticRegression(max_iter=1000, C=1.0),
        cv=5,
        n_jobs=1,
        passthrough=False,
    )
    stacking_clf.fit(x_train, y_train)
    y_pred_stack = stacking_clf.predict(x_test)
    y_prob_stack = stacking_clf.predict_proba(x_test)[:, 1]
    stack_metrics = {
        'Model':         'Stacking Ensemble',
        'Test Accuracy': accuracy_score(y_test, y_pred_stack),
        'Precision':     precision_score(y_test, y_pred_stack, zero_division=0),
        'Recall':        recall_score(y_test, y_pred_stack, zero_division=0),
        'F1':            f1_score(y_test, y_pred_stack, zero_division=0),
        'AUC':           roc_auc_score(y_test, y_prob_stack),
    }
    results.append(stack_metrics)
    joblib.dump(stacking_clf, os.path.join(MODEL_SAVE_DIR, 'stacking_ensemble.joblib'))
    print(f"Stacking Ensemble AUC: {stack_metrics['AUC']:.4f}")

    # Final ROC Plot
    fpr, tpr, _ = roc_curve(y_test, y_prob_stack)
    plt.figure(1)
    plt.plot(fpr, tpr, label=f'Stacking Ensemble (AUC = {stack_metrics["AUC"]:.2f})', linewidth=2, color='black')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curves Comparison')
    plt.legend()
    plt.savefig(os.path.join(FIGURES_DIR, "roc_comparison.png"))
    plt.close()

    # --- SHAP EXPLANATIONS (for Random Forest) ---
    print("Generating SHAP explanations...")
    import shap
    rf_clf = joblib.load(os.path.join(MODEL_SAVE_DIR, "random_forest.joblib"))
    
    # Transform test data for SHAP
    x_test_transformed = rf_clf.named_steps['preprocessor'].transform(x_test)
    if hasattr(x_test_transformed, 'toarray'):
        x_test_transformed = x_test_transformed.toarray()
        
    feature_names = rf_clf.named_steps['preprocessor'].get_feature_names_out()
    
    # Use a subset for speed if large, but 30% of 5000 is 1500, which is fine
    explainer = shap.TreeExplainer(rf_clf.named_steps['classifier'])
    shap_values = explainer.shap_values(x_test_transformed)
    
    # For binary classification, shap_values might be a list [probs_0, probs_1]
    # We want probs_1 (risk of default)
    if isinstance(shap_values, list):
        shap_values_to_plot = shap_values[1]
    else:
        shap_values_to_plot = shap_values

    # Plot 1: Summary Dot Plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values_to_plot, x_test_transformed, feature_names=feature_names, show=False)
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "shap_summary.png"))
    plt.close()
    
    # Plot 2: Importance Bar Plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values_to_plot, x_test_transformed, feature_names=feature_names, plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "shap_importance_bar.png"))
    plt.close()
    
    results_df = pd.DataFrame(results)
    results_df.to_csv(os.path.join(BASE_DIR, "research\\results\\model_comparison.csv"), index=False)
    print("\nModel training complete. Results:")
    print(results_df)
    
    return results_df

if __name__ == "__main__":
    train_and_evaluate()
