
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

def generate_3_economies_data():
    print("Generating dataset for 3 Zimbabwe Economies (Civil Servants, Vendors, Rural)...")
    np.random.seed(42)
    borrowers = []
    
    # Names for variety
    names = [
        "Tinashe Moyo", "Farai Ncube", "Simba Ndlovu", "Tendai Dube", "Nyasha Khumalo",
        "Rumbidzai Mpofu", "Tafadzwa Nyathi", "Munashe Ncube", "Anesu Nkomo", "Kumbirayi Mlilo",
        "Tatenda Bhebhe", "Ruvimbo Tshuma", "Chengetai Hlabangana", "Kudzai Sibanda", "Mufaro Mahlangu",
        "Thabani Gumbo", "Sipho Zhou", "Gugulethu Chidzero", "Nomsa Murerwa", "Bongani Mutasa",
        "Dumisani Makoni", "Khanyile Chirau", "Mpofu Zimunya", "Sikhanyiso Chikore", "Zibusiso Marere",
        "Mthokozisi Chigumba", "Nqobizitha Madzore", "Lindiwe Moyo", "Sibusiso Taylor", "Thembekile Smith"
    ]

    # --- Category 1: High Income (10 Users) ---
    # Profile: Urban, Formal, Stable Income
    for i in range(10):
        income = np.random.uniform(250, 600)
        borrowers.append({
            "name": names[i],
            "location": "Urban",
            "employment_type": "Formal",
            "economy_level": "high",
            "monthly_income": income,
            "income_stability": np.random.uniform(0.02, 0.08),
            "monthly_tx_count": np.random.randint(10, 25),
            "pct_bills_on_time": np.random.uniform(0.85, 1.0),
            "default": 0 if np.random.random() > 0.1 else 1
        })

    # --- Category 2: Middle Income (10 Users) ---
    # Profile: Urban, Informal, High Velocity/Volatile Income
    for i in range(10, 20):
        income = np.random.uniform(300, 1500)
        borrowers.append({
            "name": names[i],
            "location": "Urban",
            "employment_type": "Informal",
            "economy_level": "middle",
            "monthly_income": income,
            "income_stability": np.random.uniform(0.20, 0.45),
            "monthly_tx_count": np.random.randint(40, 120),
            "pct_bills_on_time": np.random.uniform(0.60, 0.85),
            "default": 0 if np.random.random() > 0.25 else 1
        })

    # --- Category 3: Low Income (10 Users) ---
    # Profile: Rural, Informal, Low/Seasonal Income
    for i in range(20, 30):
        income = np.random.uniform(20, 180)
        borrowers.append({
            "name": names[i],
            "location": "Rural",
            "employment_type": "Informal",
            "economy_level": "low",
            "monthly_income": income,
            "income_stability": np.random.uniform(0.40, 0.70),
            "monthly_tx_count": np.random.randint(2, 10),
            "pct_bills_on_time": np.random.uniform(0.40, 0.75),
            "default": 0 if np.random.random() > 0.4 else 1
        })

    df = pd.DataFrame(borrowers)
    df['id'] = range(1, 31)
    df['national_id'] = [f"26-{100000+i}-A-26" for i in range(30)] # Zim format
    df['phone_number'] = [f"+26377{2000000+i}" for i in range(30)]
    df['date_of_birth'] = (datetime.now() - timedelta(days=np.random.randint(20, 55)*365)).strftime('%Y-%m-%d')
    
    # Standard dissertation features
    df['income_growth'] = 0.05
    df['tx_consistency'] = 0.1
    df['tx_diversity'] = np.random.randint(1, 5, 30)
    df['preferred_tx_time'] = 14
    df['avg_days_late'] = df['pct_bills_on_time'].apply(lambda x: (1-x)*10)
    df['repeat_lateness_count'] = df['pct_bills_on_time'].apply(lambda x: int((1-x)*5))
    df['months_active'] = np.random.randint(12, 60, 30)
    df['activity_trend'] = 1.0
    df['device_stability'] = 1.0
    df['first_tx_date_months_ago'] = df['months_active']

    output_dir = os.path.join("d:\\Czae dissertation\\czae-credit-scoring\\data\\synthetic")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "borrowers_3_economies.csv")
    df.to_csv(output_path, index=False)
    print(f"Dataset generated at {output_path}")
    
    return df

if __name__ == "__main__":
    generate_3_economies_data()
