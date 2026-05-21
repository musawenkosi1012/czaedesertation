from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Annotated
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..schemas.schemas import Token, UserCreate, UserResponse
from ...database.models.base import get_db
from ...database.models.models import User, UserRole, Borrower

router = APIRouter()

# Security Config
SECRET_KEY = "czae-secret-key-for-dissertation-demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

# Using sha256_crypt which is more stable on newer Python versions than bcrypt in passlib
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Hardcoded admin
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "czae2026"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if username == ADMIN_USERNAME:
        return {"username": "admin", "role": "admin", "borrower_id": None}

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise credentials_exception

    return {"username": user.username, "role": user.role.value, "borrower_id": user.borrower_id}

def require_admin(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

def require_borrower(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if current_user["role"] != "borrower":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Borrower access required")
    return current_user

@router.post(
    "/login",
    response_model=Token,
    responses={401: {"description": "Incorrect username or password"}}
)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    if form_data.username == ADMIN_USERNAME and form_data.password == ADMIN_PASSWORD:
        access_token = create_access_token(data={"sub": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "role": "admin", "borrower_id": None}

    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value, "borrower_id": user.borrower_id}

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")

    existing_borrower = db.query(Borrower).filter(Borrower.national_id == user_data.national_id).first()
    if existing_borrower:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="National ID already registered")

    borrower = Borrower(
        national_id=user_data.national_id,
        name=user_data.name,
        phone_number=user_data.phone_number,
        date_of_birth=user_data.date_of_birth,
        location=user_data.location,
        employment_type=user_data.employment_type,
        economy_level=None,
        monthly_income=0.0,
        income_stability=1.0,
        income_growth=0.05,
        income_to_loan_ratio=1.0,
        monthly_tx_count=0.0,
        tx_consistency=0.1,
        tx_diversity=0,
        preferred_tx_time=14,
        pct_bills_on_time=1.0,
        avg_days_late=0.0,
        repeat_lateness_count=0,
        months_active=12,
        activity_trend=1.0,
        device_stability=1.0,
        first_tx_date_months_ago=12,
    )
    db.add(borrower)
    db.flush()

    user = User(
        username=user_data.username,
        hashed_password=pwd_context.hash(user_data.password),
        role=UserRole.borrower,
        borrower_id=borrower.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: Annotated[dict, Depends(get_current_user)], db: Session = Depends(get_db)):
    if current_user["role"] == "admin":
        return {"id": 0, "username": "admin", "role": "admin", "borrower_id": None}

    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user
