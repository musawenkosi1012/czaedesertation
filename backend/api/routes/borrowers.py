from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated
from ...database.models.base import get_db
from ...database.models.models import Borrower, MobileMoneyTransaction, BillPayment
from ..schemas.schemas import BorrowerResponse, BorrowerCreate
from .auth import get_current_user, require_borrower

router = APIRouter()

def get_borrower_or_404(
    borrower_id: int, 
    db: Annotated[Session, Depends(get_db)]
):
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")
    return borrower

@router.get("/", response_model=List[BorrowerResponse])
def get_borrowers(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[str, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 20
):
    return db.query(Borrower).offset(skip).limit(limit).all()

@router.get("/me", response_model=BorrowerResponse)
def get_my_profile(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(require_borrower)]
):
    borrower = db.query(Borrower).filter(Borrower.id == current_user["borrower_id"]).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower profile not found")
    return borrower

@router.get(
    "/{borrower_id}",
    response_model=BorrowerResponse,
    responses={404: {"description": "Borrower not found"}}
)
def get_borrower(
    borrower: Annotated[Borrower, Depends(get_borrower_or_404)],
    current_user: Annotated[str, Depends(get_current_user)]
):
    return borrower

@router.get(
    "/{borrower_id}/transactions",
    responses={404: {"description": "Borrower not found"}}
)
def get_borrower_transactions(
    db: Annotated[Session, Depends(get_db)], 
    current_user: Annotated[str, Depends(get_current_user)],
    borrower: Annotated[Borrower, Depends(get_borrower_or_404)], 
    skip: int = 0, 
    limit: int = 50
):
    transactions = db.query(MobileMoneyTransaction).filter(
        MobileMoneyTransaction.borrower_id == borrower.id
    ).offset(skip).limit(limit).all()

    return [
        {
            "id": t.id,
            "date": t.date,
            "amount": t.amount,
            "type": t.transaction_type,
            "counterparty": t.counterparty,
            "balance_after": t.balance_after
        }
        for t in transactions
    ]

@router.get(
    "/{borrower_id}/bills",
    responses={404: {"description": "Borrower not found"}}
)
def get_borrower_bills(
    db: Annotated[Session, Depends(get_db)], 
    current_user: Annotated[str, Depends(get_current_user)],
    borrower: Annotated[Borrower, Depends(get_borrower_or_404)], 
    skip: int = 0, 
    limit: int = 50
):
    bills = db.query(BillPayment).filter(
        BillPayment.borrower_id == borrower.id
    ).offset(skip).limit(limit).all()

    return [
        {
            "id": b.id,
            "bill_type": b.bill_type,
            "due_date": b.due_date,
            "payment_date": b.payment_date,
            "amount": b.amount,
            "days_late": b.days_late
        }
        for b in bills
    ]
