from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from typing import List
from database import get_db
import models, schemas, security

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    month_str = now.strftime("%Y-%m")
    
    total_income = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(
        models.Income.account_id == current_account.id
    ).scalar() or 0.0

    total_expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.account_id == current_account.id
    ).scalar() or 0.0

    current_month_spending = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(month_str)
    ).scalar() or 0.0

    today_spending = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date == today_str
    ).scalar() or 0.0

    this_week_spending = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date >= week_start,
        models.Expense.date <= today_str
    ).scalar() or 0.0

    remaining_monthly_budget = max(0, current_account.monthly_budget - current_month_spending)

    return {
        "current_balance": round(total_income - total_expenses, 2),
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "savings": round(total_income - total_expenses, 2),
        "current_month_spending": round(current_month_spending, 2),
        "today_spending": round(today_spending, 2),
        "this_week_spending": round(this_week_spending, 2),
        "remaining_monthly_budget": round(remaining_monthly_budget, 2)
    }


@router.get("/monthly-trend")
def get_monthly_trend(
    months: int = 12,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    result = []
    now = datetime.now()
    
    for i in range(months - 1, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        
        month_str = f"{y}-{str(m).zfill(2)}"
        month_label = datetime(y, m, 1).strftime("%b %Y")

        income = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(
            models.Income.account_id == current_account.id,
            models.Income.date.startswith(month_str)
        ).scalar() or 0.0

        expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            models.Expense.account_id == current_account.id,
            models.Expense.date.startswith(month_str)
        ).scalar() or 0.0

        result.append({
            "month": month_label,
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "savings": round(income - expenses, 2)
        })
    
    return result


@router.get("/category-distribution")
def get_category_distribution(
    month: int = None,
    year: int = None,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    month_str = f"{y}-{str(m).zfill(2)}"

    query = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("count")
    ).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(month_str)
    ).group_by(models.Expense.category).all()

    total_amount = sum(row.total for row in query)
    return [
        {
            "category": row.category,
            "amount": round(row.total, 2),
            "count": row.count,
            "percentage": round(row.total / total_amount * 100, 1) if total_amount > 0 else 0
        }
        for row in query
    ]


@router.get("/daily-spending")
def get_daily_spending(
    days: int = 30,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    result = []
    for i in range(days - 1, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        amount = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            models.Expense.account_id == current_account.id,
            models.Expense.date == d
        ).scalar() or 0.0
        result.append({"date": d, "amount": round(amount, 2)})
    return result


@router.get("/weekly-expenses")
def get_weekly_expenses(
    weeks: int = 8,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    result = []
    for i in range(weeks - 1, -1, -1):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(days=6)
        ws = week_start.strftime("%Y-%m-%d")
        we = week_end.strftime("%Y-%m-%d")
        
        amount = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            models.Expense.account_id == current_account.id,
            models.Expense.date >= ws,
            models.Expense.date <= we
        ).scalar() or 0.0
        result.append({"week": f"W{weeks - i}", "amount": round(amount, 2), "start": ws, "end": we})
    return result
