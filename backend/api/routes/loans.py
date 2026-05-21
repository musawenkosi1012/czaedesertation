from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated
from ...database.models.base import get_db
from ...database.models.models import Loan, LoanStatus, Borrower, CreditScore, RiskCategory
from ..schemas.schemas import LoanResponse, LoanCreate, LoanApply
from .auth import get_current_user, require_borrower
from ...services.loan_management.loan_sizing_engine import LoanSizingEngine

router = APIRouter()

@router.get(
    "/", 
    response_model=List[LoanResponse],
    responses={400: {"description": "Invalid status parameter"}}
)
async def get_loans(
    db: Annotated[Session, Depends(get_db)], 
    current_user: Annotated[str, Depends(get_current_user)],
    skip: int = 0, 
    limit: int = 20, 
    status: str = None
):
    query = db.query(Loan, Borrower.name).join(Borrower, Loan.borrower_id == Borrower.id)

    if status:
        try:
            status_enum = LoanStatus[status.upper()]
            query = query.filter(Loan.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    results = query.order_by(Loan.id.desc()).offset(skip).limit(limit).all()

    loans = []
    for loan, name in results:
        setattr(loan, "borrower_name", name)
        loans.append(loan)

    return loans

@router.get("/tools/repayment-calculator")
async def calculate_repayment(amount: float, annual_rate: float, duration_days: int):
    # monthly rate
    monthly_rate = (annual_rate / 100) / 12
    months = duration_days / 30
    
    if monthly_rate == 0:
        installment = amount / months
    else:
        installment = (amount * monthly_rate * (1 + monthly_rate)**months) / ((1 + monthly_rate)**months - 1)
        
    total_repayment = installment * months
    total_interest = total_repayment - amount
    
    return {
        "monthly_installment": round(installment, 2),
        "total_repayment": round(total_repayment, 2),
        "total_interest": round(total_interest, 2),
        "currency": "USD"
    }

@router.get(
    "/sizing/{borrower_id}",
    responses={404: {"description": "Borrower or Credit Score not found"}}
)
async def calculate_optimal_loan_size(
    borrower_id: int, 
    db: Annotated[Session, Depends(get_db)], 
    current_user: Annotated[str, Depends(get_current_user)]
):
    """
    Calculate optimal loan amount using comprehensive sizing engine

    Combines:
    - Income-based limits (3x monthly income)
    - DTI-based limits (35% debt-to-income)
    - Risk-adjusted limits (by risk category)
    - Expected Loss limits (portfolio risk tolerance)

    Returns the MINIMUM of all constraints (most conservative)
    """
    # Get borrower
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")

    # Get latest credit score
    score = db.query(CreditScore).filter(CreditScore.borrower_id == borrower_id).order_by(CreditScore.timestamp.desc()).first()
    if not score:
        raise HTTPException(status_code=404, detail="No credit score found for borrower")

    # Get existing loans to calculate existing debt
    existing_loans = db.query(Loan).filter(Loan.borrower_id == borrower_id, Loan.status.in_([LoanStatus.APPROVED, LoanStatus.DISBURSED])).all()
    total_existing_loan_amount = sum(loan.amount for loan in existing_loans)

    # Calculate optimal loan using comprehensive engine
    result = LoanSizingEngine.calculate_optimal_loan(
        borrower_id=borrower_id,
        monthly_income=borrower.monthly_income,
        probability_of_default=score.probability_of_default,
        risk_category=score.risk_category,
        existing_exposure=total_existing_loan_amount,
        existing_debt=0  # Simplified - could include other debts
    )

    # Return as dictionary
    return {
        "borrower_id": result.borrower_id,
        "monthly_income": round(result.monthly_income, 2),
        "probability_of_default": round(result.probability_of_default, 4),
        "risk_category": result.risk_category.value,

        # All calculation methods with explanations
        "calculation_methods": {
            "income_based": {
                "amount": round(result.income_based_max, 2),
                "explanation": f"2x monthly income (${result.monthly_income:.2f} × 2) — Zimbabwe MFI ceiling"
            },
            "dti_based": {
                "amount": round(result.dti_based_max, 2),
                "explanation": "45% DTI — informal sector norm (net income, no formal debts)"
            },
            "risk_adjusted": {
                "amount": round(result.risk_adjusted_max, 2),
                "explanation": f"Risk multiplier {LoanSizingEngine.RISK_MULTIPLIERS.get(result.risk_category, 1.0)}x for {result.risk_category} risk"
            },
            "expected_loss": {
                "amount": round(result.expected_loss_max, 2),
                "explanation": f"Expected loss model: PD={round(result.probability_of_default*100, 1)}% × LGD=50% = {round(result.probability_of_default*0.5*100, 1)}%",
                "expected_loss_per_100_usd": round(result.probability_of_default * 0.5 * 100, 2)
            }
        },

        # Recommended offer
        "recommended_offer": {
            "loan_amount": round(result.recommended_loan_amount, 2),
            "limiting_factor": f"Constrained by: {result.limiting_factor} (${getattr(result, f'{result.limiting_factor}_based_max' if result.limiting_factor != 'expected_loss' else 'expected_loss_max', result.recommended_loan_amount):.2f})",

            "term_days": result.recommended_term_days,
            "interest_rate_annual": result.recommended_interest_rate,

            "monthly_payment": round(result.monthly_payment, 2),
            "total_repayment": round(result.monthly_payment * (result.recommended_term_days / 30), 2),
            "total_interest": round(result.total_interest, 2),
        },

        # Financial details
        "financial_details": {
            "expected_loss_usd": round(result.expected_loss, 2),
            "expected_revenue_usd": round(result.expected_revenue, 2),
            "profit_after_loss": round(result.total_interest - result.expected_loss, 2),
            "roi": round(((result.total_interest - result.expected_loss) / result.recommended_loan_amount * 100) if result.recommended_loan_amount > 0 else 0, 2),
        },

        # Portfolio impact
        "portfolio_impact": {
            "exposure_pct": round(result.portfolio_exposure_pct, 4),
            "exposure_comment": "Proportion of total portfolio"
        },

        # Risk assessment
        "risk_assessment": {
            "probability_of_default_pct": round(result.probability_of_default * 100, 2),
            "loss_given_default_pct": 50.0,
            "expected_loss_rate": round(result.probability_of_default * 0.5 * 100, 2),
            "interest_rate_covers_loss": result.recommended_interest_rate > (result.probability_of_default * 0.5 * 100)
        }
    }

@router.get(
    "/{loan_id}", 
    response_model=LoanResponse,
    responses={404: {"description": "Loan not found"}}
)
async def get_loan(
    loan_id: int, 
    db: Annotated[Session, Depends(get_db)], 
    current_user: Annotated[str, Depends(get_current_user)]
):
    result = db.query(Loan, Borrower.name).join(Borrower, Loan.borrower_id == Borrower.id).filter(Loan.id == loan_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Loan not found")

    loan, name = result
    setattr(loan, "borrower_name", name)
    return loan

@router.post("/", response_model=LoanResponse)
async def create_loan(
    loan: LoanCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[str, Depends(get_current_user)]
):
    # Verify borrower exists
    borrower = db.query(Borrower).filter(Borrower.id == loan.borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")

    # Get latest credit score to determine AI-predicted max loan amount
    latest_score = (
        db.query(CreditScore)
        .filter(CreditScore.borrower_id == loan.borrower_id)
        .order_by(CreditScore.timestamp.desc())
        .first()
    )

    if latest_score:
        existing_loans = db.query(Loan).filter(
            Loan.borrower_id == loan.borrower_id,
            Loan.status.in_([LoanStatus.APPROVED, LoanStatus.DISBURSED])
        ).all()
        existing_exposure = sum(l.amount for l in existing_loans)

        sizing = LoanSizingEngine.calculate_optimal_loan(
            borrower_id=loan.borrower_id,
            monthly_income=borrower.monthly_income,
            probability_of_default=latest_score.probability_of_default,
            risk_category=latest_score.risk_category,
            existing_exposure=existing_exposure,
            existing_debt=0,
        )
        max_allowed = round(sizing.recommended_loan_amount, 2)

        if loan.amount > max_allowed:
            rejection_reason = (
                f"Requested amount ${loan.amount:,.2f} exceeds the AI-predicted maximum "
                f"of ${max_allowed:,.2f} based on your credit profile "
                f"(risk: {latest_score.risk_category.value}, "
                f"PD: {latest_score.probability_of_default*100:.1f}%). "
                f"Limiting factor: {sizing.limiting_factor}."
            )
            db_loan = Loan(
                **loan.model_dump(),
                status=LoanStatus.REJECTED,
                rejection_reason=rejection_reason,
                max_allowed_amount=max_allowed,
            )
            db.add(db_loan)
            db.commit()
            db.refresh(db_loan)
            setattr(db_loan, "borrower_name", borrower.name)
            return db_loan
    else:
        max_allowed = None

    db_loan = Loan(
        **loan.model_dump(),
        status=LoanStatus.APPROVED,
        max_allowed_amount=max_allowed,
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    setattr(db_loan, "borrower_name", borrower.name)
    return db_loan

@router.post("/apply", response_model=LoanResponse, status_code=201)
async def apply_for_loan(
    loan_in: LoanApply,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(require_borrower)]
):
    borrower_id = current_user["borrower_id"]

    # Verify borrower exists
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")

    # Get latest credit score to determine AI-predicted max loan amount
    latest_score = (
        db.query(CreditScore)
        .filter(CreditScore.borrower_id == borrower_id)
        .order_by(CreditScore.timestamp.desc())
        .first()
    )

    if latest_score:
        existing_loans = db.query(Loan).filter(
            Loan.borrower_id == borrower_id,
            Loan.status.in_([LoanStatus.APPROVED, LoanStatus.DISBURSED])
        ).all()
        existing_exposure = sum(l.amount for l in existing_loans)

        sizing = LoanSizingEngine.calculate_optimal_loan(
            borrower_id=borrower_id,
            monthly_income=borrower.monthly_income,
            probability_of_default=latest_score.probability_of_default,
            risk_category=latest_score.risk_category,
            existing_exposure=existing_exposure,
            existing_debt=0,
        )
        max_allowed = round(sizing.recommended_loan_amount, 2)

        if loan_in.amount > max_allowed:
            rejection_reason = (
                f"Requested amount ${loan_in.amount:,.2f} exceeds the AI-predicted maximum "
                f"of ${max_allowed:,.2f} based on your credit profile "
                f"(risk: {latest_score.risk_category.value}, "
                f"PD: {latest_score.probability_of_default*100:.1f}%). "
                f"Limiting factor: {sizing.limiting_factor}."
            )
            db_loan = Loan(
                borrower_id=borrower_id,
                amount=loan_in.amount,
                interest_rate=loan_in.interest_rate,
                duration_days=loan_in.duration_days,
                status=LoanStatus.REJECTED,
                rejection_reason=rejection_reason,
                max_allowed_amount=max_allowed,
            )
            db.add(db_loan)
            db.commit()
            db.refresh(db_loan)
            setattr(db_loan, "borrower_name", borrower.name)
            return db_loan
    else:
        max_allowed = None

    db_loan = Loan(
        borrower_id=borrower_id,
        amount=loan_in.amount,
        interest_rate=loan_in.interest_rate,
        duration_days=loan_in.duration_days,
        status=LoanStatus.APPROVED,
        max_allowed_amount=max_allowed,
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    setattr(db_loan, "borrower_name", borrower.name)
    return db_loan
