from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
import models, security

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def get_analytics_summary(
    year: int = None,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    y = year or now.year
    year_str = str(y)

    # Total for the year
    total_income_year = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(
        models.Income.account_id == current_account.id,
        models.Income.date.startswith(year_str)
    ).scalar() or 0.0

    total_expenses_year = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(year_str)
    ).scalar() or 0.0

    # Count for avg
    expense_count = db.query(func.count(models.Expense.id)).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(year_str)
    ).scalar() or 0

    avg_daily = total_expenses_year / 365
    avg_monthly = total_expenses_year / 12

    # Most used payment method
    payment_stats = db.query(
        models.Expense.payment_method,
        func.count(models.Expense.id).label("cnt"),
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(year_str)
    ).group_by(models.Expense.payment_method).order_by(func.count(models.Expense.id).desc()).all()

    # Top merchants
    merchant_stats = db.query(
        models.Expense.merchant,
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("cnt")
    ).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(year_str),
        models.Expense.merchant != None,
        models.Expense.merchant != ""
    ).group_by(models.Expense.merchant).order_by(func.sum(models.Expense.amount).desc()).limit(10).all()

    # Category breakdown
    category_stats = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("cnt")
    ).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(year_str)
    ).group_by(models.Expense.category).order_by(func.sum(models.Expense.amount).desc()).all()

    # Highest single expense
    highest_expense = db.query(models.Expense).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(year_str)
    ).order_by(models.Expense.amount.desc()).first()

    # Highest income
    highest_income = db.query(models.Income).filter(
        models.Income.account_id == current_account.id,
        models.Income.date.startswith(year_str)
    ).order_by(models.Income.amount.desc()).first()

    return {
        "year": y,
        "total_income": round(total_income_year, 2),
        "total_expenses": round(total_expenses_year, 2),
        "savings": round(total_income_year - total_expenses_year, 2),
        "avg_daily_expense": round(avg_daily, 2),
        "avg_monthly_expense": round(avg_monthly, 2),
        "transaction_count": expense_count,
        "most_used_payment": payment_stats[0].payment_method if payment_stats else None,
        "payment_breakdown": [
            {"method": p.payment_method, "count": p.cnt, "amount": round(p.total, 2)}
            for p in payment_stats
        ],
        "top_merchants": [
            {"merchant": m.merchant, "total": round(m.total, 2), "count": m.cnt}
            for m in merchant_stats
        ],
        "category_breakdown": [
            {"category": c.category, "total": round(c.total, 2), "count": c.cnt}
            for c in category_stats
        ],
        "highest_expense": {
            "amount": highest_expense.amount,
            "description": highest_expense.description,
            "date": highest_expense.date
        } if highest_expense else None,
        "highest_income": {
            "amount": highest_income.amount,
            "description": highest_income.description,
            "date": highest_income.date
        } if highest_income else None
    }


@router.get("/yearly-comparison")
def get_yearly_comparison(
    years: int = 3,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    result = []
    for i in range(years - 1, -1, -1):
        y = now.year - i
        income = db.query(func.coalesce(func.sum(models.Income.amount), 0)).filter(
            models.Income.account_id == current_account.id,
            models.Income.date.startswith(str(y))
        ).scalar() or 0.0
        expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            models.Expense.account_id == current_account.id,
            models.Expense.date.startswith(str(y))
        ).scalar() or 0.0
        result.append({"year": y, "income": round(income, 2), "expenses": round(expenses, 2), "savings": round(income - expenses, 2)})
    return result


@router.get("/calendar")
def get_calendar_data(
    month: int = None,
    year: int = None,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    month_str = f"{y}-{str(m).zfill(2)}"

    expenses_by_day = db.query(
        models.Expense.date,
        func.sum(models.Expense.amount).label("total"),
        func.count(models.Expense.id).label("count")
    ).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(month_str)
    ).group_by(models.Expense.date).all()

    income_by_day = db.query(
        models.Income.date,
        func.sum(models.Income.amount).label("total"),
        func.count(models.Income.id).label("count")
    ).filter(
        models.Income.account_id == current_account.id,
        models.Income.date.startswith(month_str)
    ).group_by(models.Income.date).all()

    reminders_for_month = db.query(models.Reminder).filter(
        models.Reminder.account_id == current_account.id,
        models.Reminder.due_date.startswith(month_str)
    ).all()

    calendar_data = {}
    for row in expenses_by_day:
        calendar_data.setdefault(row.date, {})["expenses"] = {"total": round(row.total, 2), "count": row.count}
    for row in income_by_day:
        calendar_data.setdefault(row.date, {})["income"] = {"total": round(row.total, 2), "count": row.count}
    for rem in reminders_for_month:
        calendar_data.setdefault(rem.due_date, {}).setdefault("reminders", []).append(
            {"id": rem.id, "title": rem.title, "status": rem.status, "priority": rem.priority}
        )

    return calendar_data


@router.get("/heatmap")
def get_expense_heatmap(
    year: int = None,
    current_account: models.Account = Depends(security.get_current_account),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    y = year or now.year

    data = db.query(
        models.Expense.date,
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.account_id == current_account.id,
        models.Expense.date.startswith(str(y))
    ).group_by(models.Expense.date).all()

    return [{"date": row.date, "amount": round(row.total, 2)} for row in data]
