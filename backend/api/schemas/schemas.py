from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from enum import Enum

# --- Enums ---
class RiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"

class LoanStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"
    REPAID = "REPAID"
    DEFAULTED = "DEFAULTED"
    REJECTED = "REJECTED"

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    borrower_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    phone_number: str
    national_id: str
    date_of_birth: datetime
    location: str
    employment_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    borrower_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Borrower ---
class BorrowerBase(BaseModel):
    national_id: str
    name: str
    phone_number: str
    date_of_birth: datetime
    location: str
    employment_type: str
    economy_level: Optional[str] = None
    created_at: datetime
    
    # Dissertation Features
    monthly_income: float
    income_stability: float
    income_growth: float
    income_to_loan_ratio: float
    monthly_tx_count: float
    tx_consistency: float
    tx_diversity: int
    preferred_tx_time: int
    pct_bills_on_time: float
    avg_days_late: float
    repeat_lateness_count: int
    months_active: int
    activity_trend: float
    device_stability: float
    first_tx_date_months_ago: int

class BorrowerCreate(BorrowerBase):
    pass

class BorrowerResponse(BorrowerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Loan ---
class LoanBase(BaseModel):
    amount: float
    interest_rate: float
    duration_days: int

class LoanCreate(LoanBase):
    borrower_id: int

class LoanApply(LoanBase):
    pass

class LoanResponse(LoanBase):
    id: int
    borrower_id: int
    borrower_name: Optional[str] = None
    status: LoanStatus
    created_at: datetime
    rejection_reason: Optional[str] = None
    max_allowed_amount: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

# --- Scoring ---
class ScoringResult(BaseModel):
    borrower_id: int
    score: int
    probability_of_default: float
    risk_category: RiskCategory
    decision: str
    key_drivers: List[dict]
    timestamp: datetime
    peer_percentile: Optional[float] = None     # % of borrowers this score exceeds
    score_delta: Optional[int] = None           # change vs previous score
    improvement_tips: Optional[List[dict]] = None  # simulated score gains

# --- Analytics ---
class ModelMetric(BaseModel):
    model_name: str
    accuracy: float
    auc: float
    f1: float

class DashboardStats(BaseModel):
    total_borrowers: int
    total_loans: int
    default_rate: float
    avg_score: float
    risk_distribution: dict
