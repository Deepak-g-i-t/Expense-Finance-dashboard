from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from config import get_settings
import models, schemas, security

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()

DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "utensils", "color": "#f97316"},
    {"name": "Transport", "icon": "car", "color": "#3b82f6"},
    {"name": "Fuel", "icon": "fuel", "color": "#eab308"},
    {"name": "Shopping", "icon": "shopping-bag", "color": "#ec4899"},
    {"name": "Electronics", "icon": "monitor", "color": "#8b5cf6"},
    {"name": "Medical", "icon": "heart-pulse", "color": "#ef4444"},
    {"name": "Entertainment", "icon": "film", "color": "#06b6d4"},
    {"name": "Education", "icon": "graduation-cap", "color": "#10b981"},
    {"name": "Bills", "icon": "file-text", "color": "#f59e0b"},
    {"name": "Rent", "icon": "home", "color": "#6366f1"},
    {"name": "Investment", "icon": "trending-up", "color": "#14b8a6"},
    {"name": "Travel", "icon": "plane", "color": "#0ea5e9"},
    {"name": "Gifts", "icon": "gift", "color": "#d946ef"},
    {"name": "Subscription", "icon": "refresh-cw", "color": "#64748b"},
    {"name": "Miscellaneous", "icon": "tag", "color": "#94a3b8"},
]


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.AccountCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Account).filter(models.Account.account_id == payload.account_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account ID already exists")

    account = models.Account(
        account_id=payload.account_id,
        hashed_pin=security.hash_pin(payload.pin),
        display_name=payload.display_name or "Personal"
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    # Seed default categories
    for cat_data in DEFAULT_CATEGORIES:
        cat = models.Category(
            account_id=account.id,
            name=cat_data["name"],
            icon=cat_data["icon"],
            color=cat_data["color"],
            is_default=True
        )
        db.add(cat)
    db.commit()

    token = security.create_access_token(
        data={"sub": account.account_id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return schemas.Token(
        access_token=token,
        account_id=account.account_id,
        display_name=account.display_name
    )


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.account_id == payload.account_id).first()
    if not account or not security.verify_pin(payload.pin, account.hashed_pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Account ID or PIN"
        )
    token = security.create_access_token(
        data={"sub": account.account_id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return schemas.Token(
        access_token=token,
        account_id=account.account_id,
        display_name=account.display_name
    )


@router.get("/me", response_model=schemas.AccountResponse)
def get_me(current_account: models.Account = Depends(security.get_current_account)):
    return current_account
