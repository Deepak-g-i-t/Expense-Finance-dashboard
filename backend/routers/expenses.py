from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from config import get_settings
import models, schemas, security
from excel_sync import sync_excel_backup

router = APIRouter(prefix="/expenses", tags=["Expenses"])
settings = get_settings()


@router.get("", response_model=schemas.PaginatedTransactions)
def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: Optional[str] = "newest",
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    query = db.query(models.Expense).filter(models.Expense.account_id == current_account.id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            models.Expense.description.ilike(s) |
            models.Expense.merchant.ilike(s) |
            models.Expense.category.ilike(s) |
            models.Expense.notes.ilike(s)
        )
    if category:
        query = query.filter(models.Expense.category == category)
    if payment_method:
        query = query.filter(models.Expense.payment_method == payment_method)
    if date_from:
        query = query.filter(models.Expense.date >= date_from)
    if date_to:
        query = query.filter(models.Expense.date <= date_to)

    if sort_by == "newest":
        query = query.order_by(models.Expense.date.desc(), models.Expense.time.desc())
    elif sort_by == "oldest":
        query = query.order_by(models.Expense.date.asc(), models.Expense.time.asc())
    elif sort_by == "highest":
        query = query.order_by(models.Expense.amount.desc())
    elif sort_by == "lowest":
        query = query.order_by(models.Expense.amount.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            {
                "id": e.id, "type": "expense", "amount": e.amount,
                "description": e.description, "category": e.category,
                "source": None, "date": e.date, "time": e.time,
                "payment_method": e.payment_method, "merchant": e.merchant,
                "notes": e.notes, "created_at": e.created_at
            } for e in items
        ],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("", response_model=schemas.ExpenseResponse, status_code=201)
def create_expense(
    payload: schemas.ExpenseCreate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    expense = models.Expense(account_id=current_account.id, **payload.dict())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return expense


@router.get("/{expense_id}", response_model=schemas.ExpenseResponse)
def get_expense(
    expense_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.account_id == current_account.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: schemas.ExpenseUpdate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.account_id == current_account.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.account_id == current_account.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return {"message": "Expense deleted successfully"}
