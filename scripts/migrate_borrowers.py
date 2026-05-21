import sqlite3
import os

BASE_DIR = r"d:\Czae dissertation\czae-credit-scoring"
DB_PATH = os.path.join(BASE_DIR, "backend", "czae_credit.db")

COLUMNS = [
    ("monthly_income", "FLOAT DEFAULT 0.0"),
    ("income_stability", "FLOAT DEFAULT 1.0"),
    ("income_growth", "FLOAT DEFAULT 0.05"),
    ("income_to_loan_ratio", "FLOAT DEFAULT 1.0"),
    ("monthly_tx_count", "FLOAT DEFAULT 0.0"),
    ("tx_consistency", "FLOAT DEFAULT 0.1"),
    ("tx_diversity", "INTEGER DEFAULT 0"),
    ("preferred_tx_time", "INTEGER DEFAULT 14"),
    ("pct_bills_on_time", "FLOAT DEFAULT 1.0"),
    ("avg_days_late", "FLOAT DEFAULT 0.0"),
    ("repeat_lateness_count", "INTEGER DEFAULT 0"),
    ("months_active", "INTEGER DEFAULT 12"),
    ("activity_trend", "FLOAT DEFAULT 1.0"),
    ("device_stability", "FLOAT DEFAULT 1.0"),
    ("first_tx_date_months_ago", "INTEGER DEFAULT 12")
]

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Get existing columns
    cur.execute("PRAGMA table_info(borrowers)")
    existing_cols = [row[1] for row in cur.fetchall()]
    
    for col_name, col_type in COLUMNS:
        if col_name not in existing_cols:
            print(f"Adding column {col_name}...")
            cur.execute(f"ALTER TABLE borrowers ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
