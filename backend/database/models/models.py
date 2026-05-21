from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from .base import Base

BORROWER_ID_REF = "borrowers.id"

class RiskCategory(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"

class LoanStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"
    REPAID = "REPAID"
    DEFAULTED = "DEFAULTED"
    REJECTED = "REJECTED"

class Borrower(Base):
    __tablename__ = "borrowers"

    id = Column(Integer, primary_key=True, index=True)
    national_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)  # "Urban" or "Rural"
    employment_type = Column(String, nullable=False) # "Formal", "Informal", "Self-employed"
    economy_level = Column(String, nullable=True)  # "low", "middle", "high"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # --- Dissertation-Consolidated Features ---
    # Income
    monthly_income = Column(Float, default=0.0)
    income_stability = Column(Float, default=1.0)
    income_growth = Column(Float, default=0.05)
    income_to_loan_ratio = Column(Float, default=1.0)
    
    # Transaction Activity
    monthly_tx_count = Column(Float, default=0.0)
    tx_consistency = Column(Float, default=0.1)
    tx_diversity = Column(Integer, default=0)
    preferred_tx_time = Column(Integer, default=14)
    
    # Payment Discipline
    pct_bills_on_time = Column(Float, default=1.0)
    avg_days_late = Column(Float, default=0.0)
    repeat_lateness_count = Column(Integer, default=0)
    
    # Digital Engagement
    months_active = Column(Integer, default=12)
    activity_trend = Column(Float, default=1.0)
    device_stability = Column(Float, default=1.0)
    first_tx_date_months_ago = Column(Integer, default=12)

    # --- Upgrade v2: Extended Alternative Data Features ---
    province                 = Column(String,  nullable=True)
    province_risk_index      = Column(Float,   default=1.00)
    income_seasonality_index = Column(Float,   default=1.10)
    savings_retention_rate   = Column(Float,   default=0.20)
    bill_type_diversity      = Column(Integer, default=2)
    merchant_to_p2p_ratio    = Column(Float,   default=0.50)
    large_tx_frequency       = Column(Integer, default=1)
    night_tx_ratio           = Column(Float,   default=0.10)
    prior_loan_count         = Column(Integer, default=0)
    debt_to_income_ratio     = Column(Float,   default=0.50)
    recipient_diversity      = Column(Integer, default=5)

    transactions = relationship("MobileMoneyTransaction", back_populates="borrower")
    loans = relationship("Loan", back_populates="borrower")
    bill_payments = relationship("BillPayment", back_populates="borrower")
    scores = relationship("CreditScore", back_populates="borrower")

class MobileMoneyTransaction(Base):
    __tablename__ = "mobile_money_data"

    id = Column(Integer, primary_key=True, index=True)
    borrower_id = Column(Integer, ForeignKey(BORROWER_ID_REF), nullable=False)
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False) # "Inflow", "Outflow", "BillPay", "Airtime"
    counterparty = Column(String)
    balance_after = Column(Float, nullable=False)

    borrower = relationship("Borrower", back_populates="transactions")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    borrower_id = Column(Integer, ForeignKey(BORROWER_ID_REF), nullable=False)
    amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    disbursement_date = Column(DateTime)
    status = Column(Enum(LoanStatus), default=LoanStatus.PENDING)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    rejection_reason = Column(String, nullable=True)
    max_allowed_amount = Column(Float, nullable=True)

    borrower = relationship("Borrower", back_populates="loans")

class BillPayment(Base):
    __tablename__ = "bill_payments"

    id = Column(Integer, primary_key=True, index=True)
    borrower_id = Column(Integer, ForeignKey(BORROWER_ID_REF), nullable=False)
    bill_type = Column(String, nullable=False) # "Electricity", "Water", "Internet"
    due_date = Column(DateTime, nullable=False)
    payment_date = Column(DateTime)
    amount = Column(Float, nullable=False)
    days_late = Column(Integer, default=0)

    borrower = relationship("Borrower", back_populates="bill_payments")

class CreditScore(Base):
    __tablename__ = "credit_scores"

    id = Column(Integer, primary_key=True, index=True)
    borrower_id = Column(Integer, ForeignKey(BORROWER_ID_REF), nullable=False)
    score = Column(Integer, nullable=False) # 300-850 range
    risk_category = Column(Enum(RiskCategory), nullable=False)
    probability_of_default = Column(Float, nullable=False)
    features_used = Column(String) # JSON string of features
    model_version = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    borrower = relationship("Borrower", back_populates="scores")

class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    borrower_id = Column(Integer, ForeignKey(BORROWER_ID_REF), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    predicted_outcome = Column(Integer, nullable=False) # 0 for Repaid, 1 for Default
    confidence = Column(Float, nullable=False)
    key_features = Column(String) # JSON string of top features
    final_decision = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class UserRole(enum.Enum):
    admin = "admin"
    borrower = "borrower"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.borrower)
    borrower_id = Column(Integer, ForeignKey(BORROWER_ID_REF), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    borrower = relationship("Borrower", foreign_keys=[borrower_id])
