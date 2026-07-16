from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

# ─── Auth Schemas ───────────────────────────────────────────────────────────
class AccountCreate(BaseModel):
    account_id: str
    pin: str
    display_name: Optional[str] = "Personal"

class LoginRequest(BaseModel):
    account_id: str
    pin: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account_id: str
    display_name: str

class AccountResponse(BaseModel):
    id: int
    account_id: str
    display_name: str
    currency: str
    monthly_budget: float
    default_payment_method: str
    default_category: str
    dark_mode: bool
    created_at: datetime

    class Config:
        orm_mode = True

# ─── Category Schemas ────────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366f1"

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    is_default: bool

    class Config:
        orm_mode = True

# ─── Expense Schemas ─────────────────────────────────────────────────────────
class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str
    merchant: Optional[str] = None
    date: str
    time: str
    payment_method: Optional[str] = "Cash"
    notes: Optional[str] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    description: str
    merchant: Optional[str]
    date: str
    time: str
    payment_method: str
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# ─── Income Schemas ──────────────────────────────────────────────────────────
class IncomeCreate(BaseModel):
    amount: float
    source: str
    description: str
    date: str
    time: str
    notes: Optional[str] = None

class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    source: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None

class IncomeResponse(BaseModel):
    id: int
    amount: float
    source: str
    description: str
    date: str
    time: str
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# ─── Budget Schemas ──────────────────────────────────────────────────────────
class BudgetCreate(BaseModel):
    category: str
    amount: float
    month: int
    year: int

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None

class BudgetResponse(BaseModel):
    id: int
    category: str
    amount: float
    month: int
    year: int
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0

    class Config:
        orm_mode = True

# ─── Reminder Schemas ────────────────────────────────────────────────────────
class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: Optional[float] = None
    due_date: str
    reminder_date: str
    priority: Optional[str] = "medium"
    repeat: Optional[str] = "one_time"
    status: Optional[str] = "pending"

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[str] = None
    reminder_date: Optional[str] = None
    priority: Optional[str] = None
    repeat: Optional[str] = None
    status: Optional[str] = None

class ReminderResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    amount: Optional[float]
    due_date: str
    reminder_date: str
    priority: str
    repeat: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

# ─── Settings Schemas ────────────────────────────────────────────────────────
class SettingsUpdate(BaseModel):
    display_name: Optional[str] = None
    currency: Optional[str] = None
    monthly_budget: Optional[float] = None
    default_payment_method: Optional[str] = None
    default_category: Optional[str] = None
    dark_mode: Optional[bool] = None

class PinChange(BaseModel):
    current_pin: str
    new_pin: str

# ─── Dashboard Schemas ───────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    current_balance: float
    total_income: float
    total_expenses: float
    savings: float
    current_month_spending: float
    today_spending: float
    this_week_spending: float
    remaining_monthly_budget: float

# ─── Transaction List Schemas ────────────────────────────────────────────────
class TransactionItem(BaseModel):
    id: int
    type: str
    amount: float
    description: str
    category: Optional[str]
    source: Optional[str]
    date: str
    time: str
    payment_method: Optional[str]
    merchant: Optional[str]
    notes: Optional[str]
    created_at: datetime

class PaginatedTransactions(BaseModel):
    items: List[TransactionItem]
    total: int
    page: int
    page_size: int
    total_pages: int
