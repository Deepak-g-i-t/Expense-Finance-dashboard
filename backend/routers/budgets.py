from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from database import get_db
from config import get_settings
import models, schemas, security
from excel_sync import sync_excel_backup

router = APIRouter(prefix="/budgets", tags=["Budgets"])
settings = get_settings()


def compute_budget_stats(budget: models.Budget, db: Session, account_id: int) -> dict:
    spent = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.account_id == account_id,
        models.Expense.category == budget.category,
        func.strftime('%m', models.Expense.date) == str(budget.month).zfill(2),
        func.strftime('%Y', models.Expense.date) == str(budget.year)
    ).scalar() or 0.0
    
    remaining = budget.amount - spent
    percentage = (spent / budget.amount * 100) if budget.amount > 0 else 0

    return {
        "id": budget.id,
        "category": budget.category,
        "amount": budget.amount,
        "month": budget.month,
        "year": budget.year,
        "spent": round(spent, 2),
        "remaining": round(remaining, 2),
        "percentage": round(percentage, 1)
    }


@router.get("", response_model=List[schemas.BudgetResponse])
def list_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    m = month or now.month
    y = year or now.year

    budgets = db.query(models.Budget).filter(
        models.Budget.account_id == current_account.id,
        models.Budget.month == m,
        models.Budget.year == y
    ).all()

    return [compute_budget_stats(b, db, current_account.id) for b in budgets]


@router.post("", response_model=schemas.BudgetResponse, status_code=201)
def create_budget(
    payload: schemas.BudgetCreate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Budget).filter(
        models.Budget.account_id == current_account.id,
        models.Budget.category == payload.category,
        models.Budget.month == payload.month,
        models.Budget.year == payload.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this category and month already exists")

    budget = models.Budget(account_id=current_account.id, **payload.dict())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return compute_budget_stats(budget, db, current_account.id)


@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(
    budget_id: int,
    payload: schemas.BudgetUpdate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.account_id == current_account.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return compute_budget_stats(budget, db, current_account.id)


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.account_id == current_account.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return {"message": "Budget deleted"}
