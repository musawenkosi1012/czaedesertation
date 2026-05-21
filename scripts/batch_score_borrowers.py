import joblib
import pandas as pd
import sqlite3
import os
from datetime import datetime

# Paths
BASE_DIR = r"d:\Czae dissertation\czae-credit-scoring"
DB_PATH = os.path.join(BASE_DIR, "backend", "czae_credit.db")
MODEL_PATH = os.path.join(BASE_DIR, "ml_pipeline", "models", "saved", "random_forest.joblib")
CSV_PATH = os.path.join(BASE_DIR, "data", "processed", "featured_borrowers.csv")

def calculate_credit_score(prob_default: float) -> int:
    return int(850 - (prob_default * 550))

def get_risk_category(score: int) -> str:
    if score >= 750: return "LOW"
    if score >= 650: return "MEDIUM"
    if score >= 550: return "HIGH"
    return "VERY_HIGH"

def batch_score():
    print(f"Loading model from {MODEL_PATH}...")
    model_pipeline = joblib.load(MODEL_PATH)
    
    print(f"Loading features from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Clear existing scores to avoid duplicates if re-running
    cur.execute("DELETE FROM credit_scores")
    
    print(f"Scoring {len(df)} borrowers...")
    scores_to_insert = []
    
    # Pre-calculate predictions in bulk for speed
    X = df.drop(columns=['borrower_id', 'default'])
    probs = model_pipeline.predict_proba(X)[:, 1]
    
    for i, row in df.iterrows():
        borrower_id = int(row['borrower_id'])
        prob_default = float(probs[i])
        score = calculate_credit_score(prob_default)
        risk_cat = get_risk_category(score)
        
        scores_to_insert.append((
            borrower_id,
            score,
            risk_cat,
            prob_default,
            "1.0.0",
            datetime.utcnow().isoformat()
        ))
        
        if len(scores_to_insert) >= 500:
            cur.executemany("""
                INSERT INTO credit_scores 
                (borrower_id, score, risk_category, probability_of_default, model_version, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, scores_to_insert)
            scores_to_insert = []
            print(f"Inserted {i+1} scores...")

    if scores_to_insert:
        cur.executemany("""
            INSERT INTO credit_scores 
            (borrower_id, score, risk_category, probability_of_default, model_version, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, scores_to_insert)

    conn.commit()
    conn.close()
    print("Batch scoring complete.")

if __name__ == "__main__":
    batch_score()
