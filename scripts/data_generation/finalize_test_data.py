import sqlite3
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime

# Set seed for consistency
np.random.seed(42)

# Paths
BASE_DIR = r"d:\Czae dissertation\czae-credit-scoring"
DB_PATH = os.path.join(BASE_DIR, "backend", "czae_credit.db")
MODEL_PATH = os.path.join(BASE_DIR, "ml_pipeline", "models", "saved", "random_forest.joblib")
FEATURED_DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "featured_borrowers.csv")

# Names
shona_first = ["Tinashe", "Farai", "Simba", "Tendai", "Nyasha", "Rumbidzai", "Tafadzwa", "Munashe", "Anesu", "Kumbirayi", "Tatenda", "Ruvimbo", "Chengetai", "Kudzai", "Mufaro"]
shona_last = ["Moyo", "Chimutengwende", "Mushore", "Gumbo", "Zhou", "Chidzero", "Murerwa", "Mutasa", "Makoni", "Chirau", "Zimunya", "Chikore", "Marere", "Chigumba", "Madzore"]
ndebele_first = ["Thabani", "Sipho", "Gugulethu", "Nomsa", "Bongani", "Dumisani", "Khanyile", "Mpofu", "Sikhanyiso", "Zibusiso", "Mthokozisi", "Nqobizitha", "Lindiwe", "Sibusiso", "Thembekile"]
ndebele_last = ["Ndlovu", "Dube", "Khumalo", "Mpofu", "Nyathi", "Ncube", "Nkomo", "Mlilo", "Bhebhe", "Tshuma", "Hlabangana", "Khumalo", "Moyo", "Sibanda", "Mahlangu"]
english_first = ["James", "John", "Mary", "Elizabeth", "William", "Robert", "Patricia", "Michael", "Linda", "David", "Richard", "Susan", "Joseph", "Thomas", "Sarah"]
english_last = ["Smith", "Jones", "Taylor", "Williams", "Brown", "Wilson", "Evans", "Roberts", "Thomas", "Walker", "Johnson", "Lewis", "Robinson", "Clarke", "Wright"]

def get_random_name():
    name_type = np.random.choice(["shona", "ndebele", "english"])
    if name_type == "shona":
        return f"{np.random.choice(shona_first)} {np.random.choice(shona_last)}"
    elif name_type == "ndebele":
        return f"{np.random.choice(ndebele_first)} {np.random.choice(ndebele_last)}"
    else:
        return f"{np.random.choice(english_first)} {np.random.choice(english_last)}"

def finalize_data():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Updating borrower names...")
    cursor.execute("SELECT id FROM borrowers")
    borrower_ids = cursor.fetchall()
    db_bids = {bid for (bid,) in borrower_ids}
    
    for (bid,) in borrower_ids:
        new_name = get_random_name()
        cursor.execute("UPDATE borrowers SET name = ? WHERE id = ?", (new_name, bid))
    
    conn.commit()
    print(f"Updated {len(borrower_ids)} names.")
    
    print("Performing credit assessments (BULK)...")
    if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURED_DATA_PATH):
        print("Missing model or features.")
        return

    model = joblib.load(MODEL_PATH)
    features_df = pd.read_csv(FEATURED_DATA_PATH)
    
    # Filter to existing borrowers
    features_df = features_df[features_df['borrower_id'].isin(db_bids)]
    
    # Extract features
    X = features_df.drop(['borrower_id', 'default'], axis=1)
    
    # Bulk prediction
    probs = model.predict_proba(X)[:, 1]
    
    # Clear existing scores
    cursor.execute("DELETE FROM credit_scores")
    
    insert_data = []
    for bid, prob in zip(features_df['borrower_id'], probs):
        score = int(850 - (prob * 550))
        if score >= 750: risk_cat = "LOW"
        elif score >= 650: risk_cat = "MEDIUM"
        elif score >= 550: risk_cat = "HIGH"
        else: risk_cat = "VERY_HIGH"
        
        insert_data.append((int(bid), score, risk_cat, float(prob), "1.0.0", datetime.utcnow().isoformat()))
        
    cursor.executemany("""
        INSERT INTO credit_scores (borrower_id, score, risk_category, probability_of_default, model_version, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, insert_data)
        
    conn.commit()
    conn.close()
    print(f"Successfully completed {len(insert_data)} assessments.")

if __name__ == "__main__":
    finalize_data()
