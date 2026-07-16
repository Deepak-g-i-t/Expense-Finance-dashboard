from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from config import get_settings
import models, schemas, security
from excel_sync import sync_excel_backup

router = APIRouter(prefix="/reminders", tags=["Reminders"])
settings = get_settings()


@router.get("", response_model=List[schemas.ReminderResponse])
def list_reminders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    query = db.query(models.Reminder).filter(models.Reminder.account_id == current_account.id)
    if status:
        query = query.filter(models.Reminder.status == status)
    if priority:
        query = query.filter(models.Reminder.priority == priority)
    return query.order_by(models.Reminder.due_date.asc()).all()


@router.post("", response_model=schemas.ReminderResponse, status_code=201)
def create_reminder(
    payload: schemas.ReminderCreate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    reminder = models.Reminder(account_id=current_account.id, **payload.dict())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return reminder


@router.put("/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(
    reminder_id: int,
    payload: schemas.ReminderUpdate,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.account_id == current_account.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(reminder, field, value)
    db.commit()
    db.refresh(reminder)
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return reminder


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.account_id == current_account.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    sync_excel_backup(db, current_account, settings.EXCEL_BACKUP_PATH)
    return {"message": "Reminder deleted"}
