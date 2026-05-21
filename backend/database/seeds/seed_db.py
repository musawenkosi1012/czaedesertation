import pandas as pd
import numpy as np
import os
import sys
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Add the project root to sys.path to allow imports from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from backend.database.models.base import SessionLocal, engine, Base
from backend.database.models.models import Borrower, MobileMoneyTransaction, BillPayment, Loan, LoanStatus, User, UserRole

rng = np.random.default_rng(42)
# Use low rounds for seeding speed — auth.py uses default (high) rounds for real logins
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto", sha256_crypt__rounds=1000)
DEFAULT_BORROWER_PASSWORD = "Czae2026!"

# Zimbabwe Name Lists
shona_first = ["Tinashe", "Farai", "Simba", "Tendai", "Nyasha", "Rumbidzai", "Tafadzwa", "Munashe", "Anesu", "Kumbirayi", "Tatenda", "Ruvimbo", "Chengetai", "Kudzai", "Mufaro"]
shona_last = ["Moyo", "Chimutengwende", "Mushore", "Gumbo", "Zhou", "Chidzero", "Murerwa", "Mutasa", "Makoni", "Chirau", "Zimunya", "Chikore", "Marere", "Chigumba", "Madzore"]
ndebele_first = ["Thabani", "Sipho", "Gugulethu", "Nomsa", "Bongani", "Dumisani", "Khanyile", "Mpofu", "Sikhanyiso", "Zibusiso", "Mthokozisi", "Nqobizitha", "Lindiwe", "Sibusiso", "Thembekile"]
ndebele_last = ["Ndlovu", "Dube", "Khumalo", "Mpofu", "Nyathi", "Ncube", "Nkomo", "Mlilo", "Bhebhe", "Tshuma", "Hlabangana", "Khumalo", "Moyo", "Sibanda", "Mahlangu"]
english_first = ["James", "John", "Mary", "Elizabeth", "William", "Robert", "Patricia", "Michael", "Linda", "David", "Richard", "Susan", "Joseph", "Thomas", "Sarah"]
english_last = ["Smith", "Jones", "Taylor", "Williams", "Brown", "Wilson", "Evans", "Roberts", "Thomas", "Walker", "Johnson", "Lewis", "Robinson", "Clarke", "Wright"]

def get_random_name():
    name_type = rng.choice(["shona", "ndebele", "english"])
    if name_type == "shona":
        return f"{rng.choice(shona_first)} {rng.choice(shona_last)}"
    elif name_type == "ndebele":
        return f"{rng.choice(ndebele_first)} {rng.choice(ndebele_last)}"
    else:
        return f"{rng.choice(english_first)} {rng.choice(english_last)}"

def get_realistic_income(economy_level: str) -> float:
    """Zimbabwe-realistic monthly income in USD."""
    if economy_level == "high":
        return float(rng.uniform(700, 2200))    # Formal sector, urban professionals
    elif economy_level == "middle":
        return float(rng.uniform(200, 700))     # Semi-formal / informal SME
    else:
        return float(rng.uniform(60, 250))      # Rural / subsistence informal

def clear_database(db: Session):
    print("Clearing old data...")
    db.query(MobileMoneyTransaction).delete()
    db.query(BillPayment).delete()
    db.query(Loan).delete()
    db.query(User).delete()
    db.query(Borrower).delete()
    db.commit()

def create_borrower_history(db: Session, borrower: Borrower, row: pd.Series):
    # 1. Create Transactions that MATCH the generated income
    target_monthly_income = row['monthly_income']
    num_months = 6
    all_inflows = 0
    total_tx_count = 0
    monthly_incomes = []
    monthly_tx_counts = []

    all_hours: list[int] = []

    for m in range(num_months):
        inflow = target_monthly_income * rng.uniform(0.85, 1.15)
        all_inflows += inflow
        monthly_incomes.append(inflow)

        inflow_hour = int(rng.integers(8, 18))
        all_hours.append(inflow_hour)
        db.add(MobileMoneyTransaction(
            borrower_id=borrower.id,
            date=(datetime.now() - timedelta(days=int(30*m + 1))).replace(hour=inflow_hour, minute=0, second=0),
            amount=inflow,
            transaction_type="Inflow",
            balance_after=inflow * 1.5
        ))

        # Realistic outflow count based on economy level
        if row['economy_level'] == 'high':
            num_out = int(rng.integers(8, 15))
        elif row['economy_level'] == 'middle':
            num_out = int(rng.integers(25, 50))
        else:  # low
            num_out = int(rng.integers(1, 5))

        total_tx_count += num_out
        monthly_tx_counts.append(num_out)

        for _ in range(num_out):
            if row['economy_level'] == 'high':
                amount = rng.uniform(100, 800)
            elif row['economy_level'] == 'middle':
                amount = rng.uniform(20, 300)
            else:  # low
                amount = rng.uniform(5, 100)

            out_hour = int(rng.integers(7, 22))
            all_hours.append(out_hour)
            db.add(MobileMoneyTransaction(
                borrower_id=borrower.id,
                date=(datetime.now() - timedelta(days=int(30*m + rng.integers(2, 28)))).replace(hour=out_hour, minute=0, second=0),
                amount=amount,
                transaction_type="Outflow",
                balance_after=rng.uniform(500, 5000)
            ))

        # BillPay (1 per month) and Airtime top-ups (2 per month) with daytime hours
        bp_hour = int(rng.integers(8, 12))
        all_hours.append(bp_hour)
        db.add(MobileMoneyTransaction(
            borrower_id=borrower.id,
            date=(datetime.now() - timedelta(days=int(30*m + rng.integers(3, 20)))).replace(hour=bp_hour, minute=0, second=0),
            amount=float(rng.uniform(20, 200)),
            transaction_type="BillPay",
            balance_after=float(rng.uniform(100, 2000))
        ))
        for _ in range(2):
            at_hour = int(rng.integers(10, 18))
            all_hours.append(at_hour)
            db.add(MobileMoneyTransaction(
                borrower_id=borrower.id,
                date=(datetime.now() - timedelta(days=int(30*m + rng.integers(1, 28)))).replace(hour=at_hour, minute=0, second=0),
                amount=float(rng.uniform(1, 15)),
                transaction_type="Airtime",
                balance_after=float(rng.uniform(50, 500))
            ))
        total_tx_count += 3  # BillPay + 2 Airtime
        monthly_tx_counts[-1] += 3

    # Store computed tenure/diversity features from transaction history
    borrower.months_active = int(row.get('months_active', 6))
    borrower.tx_diversity = 4  # Inflow, Outflow, BillPay, Airtime all present
    borrower.preferred_tx_time = int(np.bincount(all_hours).argmax()) if all_hours else 14

    # 2. Create Bill Payments with realistic patterns
    all_bills = []
    bills_on_time = 0
    total_days_late = 0

    for j in range(8):  # 8 bills over time
        due_date = datetime.now() - timedelta(days=int(30*j + 5))
        is_late = rng.random() > row['pct_bills_on_time']
        days_late = int(rng.integers(1, 20)) if is_late else 0

        if not is_late:
            bills_on_time += 1
        total_days_late += days_late

        # Bill amounts vary by economy
        if row['economy_level'] == 'high':
            bill_amount = rng.uniform(1500, 4000)
        elif row['economy_level'] == 'middle':
            bill_amount = rng.uniform(500, 1500)
        else:  # low
            bill_amount = rng.uniform(200, 800)

        bill = BillPayment(
            borrower_id=borrower.id,
            bill_type="Electricity",
            due_date=due_date,
            payment_date=due_date + timedelta(days=days_late),
            amount=bill_amount,
            days_late=days_late
        )
        db.add(bill)
        all_bills.append(bill)

    # Update borrower with calculated metrics
    borrower.monthly_income = all_inflows / num_months
    borrower.monthly_tx_count = total_tx_count / num_months
    borrower.pct_bills_on_time = bills_on_time / 8 if all_bills else 1.0
    borrower.avg_days_late = total_days_late / 8 if all_bills else 0.0
    borrower.repeat_lateness_count = sum(1 for b in all_bills if b.days_late > 0)

    # Compute real derived features from generated transaction patterns
    mean_inc = np.mean(monthly_incomes)
    std_inc = np.std(monthly_incomes)
    borrower.income_stability = float(np.clip(1.0 - (std_inc / (mean_inc + 1e-6)), 0.0, 1.0))

    mean_tc = np.mean(monthly_tx_counts)
    std_tc = np.std(monthly_tx_counts)
    borrower.tx_consistency = float(np.clip(1.0 - (std_tc / (mean_tc + 1e-6)), 0.0, 1.0))

    first_half_inc = np.mean(monthly_incomes[:3])
    second_half_inc = np.mean(monthly_incomes[3:])
    borrower.income_growth = float((second_half_inc - first_half_inc) / (first_half_inc + 1e-6))

    first_half_tx = np.mean(monthly_tx_counts[:3])
    second_half_tx = np.mean(monthly_tx_counts[3:])
    borrower.activity_trend = float((second_half_tx - first_half_tx) / (first_half_tx + 1e-6))

    # Device stability: economy-level gradient, independent of pct_bills_on_time
    if row['economy_level'] == 'high':
        borrower.device_stability = float(np.clip(rng.beta(8, 2), 0.55, 1.00))    # mean ~0.80
    elif row['economy_level'] == 'middle':
        borrower.device_stability = float(np.clip(rng.beta(6, 4), 0.30, 0.90))    # mean ~0.60
    else:
        borrower.device_stability = float(np.clip(rng.beta(4, 6), 0.10, 0.75))    # mean ~0.40

    # 3. Create Loan history with risk-appropriate amounts
    loan_status = LoanStatus.DEFAULTED if row['default'] == 1 else LoanStatus.REPAID

    # Calculate credit ceiling based on income, payment discipline, and economy level
    # Higher income + good payment history = higher ceiling
    if row['economy_level'] == 'high':
        # High income, formal: 5-8x monthly income ceiling
        base_ceiling = borrower.monthly_income * rng.uniform(5, 8)
        loan_amount = rng.choice([2500, 5000, 7500, 10000, 15000])
        interest_rate = rng.uniform(8.0, 12.0)  # Lower risk = lower rate
    elif row['economy_level'] == 'middle':
        # Middle income, informal: 2-4x monthly income ceiling
        base_ceiling = borrower.monthly_income * rng.uniform(2, 4)
        loan_amount = rng.choice([500, 750, 1000, 1500, 2000])
        interest_rate = rng.uniform(12.0, 18.0)  # Medium risk
    else:  # low income
        # Low income, rural: 0.5-1.5x monthly income ceiling (constrained)
        base_ceiling = borrower.monthly_income * rng.uniform(0.5, 1.5)
        loan_amount = rng.choice([50, 100, 150, 200, 250])
        interest_rate = rng.uniform(18.0, 25.0)  # Higher risk = higher rate

    # Adjust ceiling based on payment discipline
    if borrower.pct_bills_on_time > 0.75:
        max_ceiling = base_ceiling * 1.3  # Bonus for good payment history
    elif borrower.pct_bills_on_time > 0.5:
        max_ceiling = base_ceiling
    else:
        max_ceiling = base_ceiling * 0.7  # Penalty for poor payment history

    loan = Loan(
        borrower_id=borrower.id,
        amount=float(loan_amount),
        interest_rate=float(interest_rate),
        duration_days=int(rng.choice([14, 21, 30, 45, 60, 90])),
        disbursement_date=datetime.now() - timedelta(days=int(rng.integers(30, 120))),
        status=loan_status,
        max_allowed_amount=float(max_ceiling)
    )
    db.add(loan)

def seed_database():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    clear_database(db)
    
    try:
        # Prefer the full 5000-row CSV; fall back to the 3-economy subset if needed
        _data_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "synthetic"))
        csv_path = os.path.join(_data_dir, "borrowers.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(_data_dir, "borrowers_3_economies.csv")

        df = pd.read_csv(csv_path)

        # Infer economy_level from income distribution if not present in CSV
        if 'economy_level' not in df.columns:
            q33 = df['monthly_income'].quantile(0.33)
            q67 = df['monthly_income'].quantile(0.67)
            df['economy_level'] = pd.cut(
                df['monthly_income'],
                bins=[-np.inf, q33, q67, np.inf],
                labels=['low', 'middle', 'high']
            ).astype(str)

        total_borrowers = len(df)
        print(f"Seeding {total_borrowers} borrowers from {os.path.basename(csv_path)}...")
        
        for i, (_, row) in enumerate(df.iterrows()):
            economy = str(row.get('economy_level', 'middle'))
            row = row.copy()
            row['monthly_income'] = get_realistic_income(economy)
            row['economy_level'] = economy

            borrower = Borrower(
                national_id=row['national_id'],
                name=get_random_name(),
                phone_number=row['phone_number'],
                date_of_birth=pd.to_datetime(row['date_of_birth']),
                location=row['location'],
                employment_type=row['employment_type'],
                economy_level=economy,
                province                 = str(row.get('province', 'Harare')),
                province_risk_index      = float(row.get('province_risk_index', 1.0)),
                income_seasonality_index = float(row.get('income_seasonality_index', 1.1)),
                savings_retention_rate   = float(row.get('savings_retention_rate', 0.2)),
                bill_type_diversity      = int(row.get('bill_type_diversity', 2)),
                merchant_to_p2p_ratio    = float(row.get('merchant_to_p2p_ratio', 0.5)),
                large_tx_frequency       = int(row.get('large_tx_frequency', 1)),
                night_tx_ratio           = float(row.get('night_tx_ratio', 0.1)),
                prior_loan_count         = int(row.get('prior_loan_count', 0)),
                debt_to_income_ratio     = float(row.get('debt_to_income_ratio', 0.5)),
                recipient_diversity      = int(row.get('recipient_diversity', 5)),
            )
            db.add(borrower)
            db.flush()

            create_borrower_history(db, borrower, row)

            # Create User account for borrower
            user = User(
                username=borrower.national_id,
                hashed_password=pwd_context.hash(DEFAULT_BORROWER_PASSWORD),
                role=UserRole.borrower,
                borrower_id=borrower.id,
            )
            db.add(user)

            if (i + 1) % 1000 == 0:
                print(f"Progress: {i + 1}/{total_borrowers} borrowers seeded...")
                db.commit()
            
        db.commit()
        print("Database re-seeded successfully with predictive features!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
