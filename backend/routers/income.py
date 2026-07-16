from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from config import get_settings
import models, schemas, security
from excel_sync import sync_excel_backup

router = APIRouter(prefix="/income", tags=["Income"])
settings = get_settings()


@router.get("", response_model=schemas.PaginatedTransactions)
def list_income(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: Optional[str] = "newest",
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    query = db.query(models.Income).filter(models.Income.account_id == current_account.id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            models.Income.description.ilike(s) |
            models.Income.source.ilike(s) |
            models.Income.notes.ilike(s)
        )
    if source:
        query = query.filter(models.Income.source == source)
    if date_from:
        query = query.filter(models.Income.date >= date_from)
    if date_to:
        query = query.filter(models.Income.date <= date_to)

    if sort_by == "newest":
        query = query.order_by(models.Income.date.desc())
    elif sort_by == "oldest":
        query = query.order_by(models.Income.date.asc())
    elif sort_by == "highest":
        query = query.order_by(models.Income.amount.desc())
    elif sort_by == "lowest":
        query = query.order_by(models.Income.amount.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            {
                "id": i.id, "type": "income", "amount": i.amount,
                "description": i.description, "category": None,
                "source": i.source, "date": i.date, "time": i.time,
                "payment_method": None, "merchant": None,
                "notes": i.notes, "created_at": i.created_at
            } for i in items
        ],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("", response_model=schemas.IncomeResponse, status_code=201)
def create_income(
    payload: schemas.IncomeCreate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    income = models.Income(account_id=current_account.id, **payload.dict())
    db.add(income)
    db.commit()
    db.refresh(income)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return income


@router.get("/{income_id}", response_model=schemas.IncomeResponse)
def get_income(
    income_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.account_id == current_account.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")
    return income


@router.put("/{income_id}", response_model=schemas.IncomeResponse)
def update_income(
    income_id: int,
    payload: schemas.IncomeUpdate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.account_id == current_account.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(income, field, value)
    db.commit()
    db.refresh(income)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return income


@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.account_id == current_account.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")
    db.delete(income)
    db.commit()
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return {"message": "Income deleted successfully"}
