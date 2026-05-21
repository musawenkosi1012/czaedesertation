import pandas as pd
import sqlite3
import os

BASE_DIR = r"d:\Czae dissertation\czae-credit-scoring"
DB_PATH = os.path.join(BASE_DIR, "backend", "czae_credit.db")
CSV_PATH = os.path.join(BASE_DIR, "data", "processed", "featured_borrowers.csv")

def import_features():
    print("Importing dissertation features into database...")
    df = pd.read_csv(CSV_PATH)
    conn = sqlite3.connect(DB_PATH)
    
    # Update each borrower with their features
    for _, row in df.iterrows():
        conn.execute("""
            UPDATE borrowers SET
                monthly_income = ?,
                income_stability = ?,
                income_growth = ?,
                income_to_loan_ratio = ?,
                monthly_tx_count = ?,
                tx_consistency = ?,
                tx_diversity = ?,
                preferred_tx_time = ?,
                pct_bills_on_time = ?,
                avg_days_late = ?,
                repeat_lateness_count = ?,
                months_active = ?,
                activity_trend = ?,
                device_stability = ?,
                first_tx_date_months_ago = ?
            WHERE id = ?
        """, (
            row['monthly_income'], row['income_stability'], row['income_growth'], 
            row['income_to_loan_ratio'], row['monthly_tx_count'], row['tx_consistency'],
            int(row['tx_diversity']), int(row['preferred_tx_time']), row['pct_bills_on_time'],
            row['avg_days_late'], int(row['repeat_lateness_count']), int(row['months_active']),
            row['activity_trend'], row['device_stability'], int(row['first_tx_date_months_ago']),
            int(row['borrower_id'])
        ))
    
    conn.commit()
    conn.close()
    print("Features imported successfully.")

if __name__ == "__main__":
    import_features()
