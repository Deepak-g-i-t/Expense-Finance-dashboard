from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from config import get_settings
import models, schemas, security
from excel_sync import sync_excel_backup

router = APIRouter(prefix="/categories", tags=["Categories"])
settings = get_settings()


@router.get("", response_model=List[schemas.CategoryResponse])
def list_categories(
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    return db.query(models.Category).filter(
        models.Category.account_id == current_account.id
    ).order_by(models.Category.is_default.desc(), models.Category.name).all()


@router.post("", response_model=schemas.CategoryResponse, status_code=201)
def create_category(
    payload: schemas.CategoryCreate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Category).filter(
        models.Category.account_id == current_account.id,
        models.Category.name == payload.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    cat = models.Category(account_id=current_account.id, **payload.dict(), is_default=False)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return cat


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    cat = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.account_id == current_account.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default categories")
    db.delete(cat)
    db.commit()
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return {"message": "Category deleted"}
