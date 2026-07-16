from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, unique=True, index=True, nullable=False)
    hashed_pin = Column(String, nullable=False)
    display_name = Column(String, default="Personal")
    currency = Column(String, default="₹")
    monthly_budget = Column(Float, default=0.0)
    default_payment_method = Column(String, default="Cash")
    default_category = Column(String, default="Miscellaneous")
    dark_mode = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    expenses = relationship("Expense", back_populates="account", cascade="all, delete-orphan")
    incomes = relationship("Income", back_populates="account", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="account", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="account", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="account", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    name = Column(String, nullable=False)
    icon = Column(String, default="tag")
    color = Column(String, default="#6366f1")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", back_populates="categories")
    expenses = relationship("Expense", back_populates="category_rel")
    budgets = relationship("Budget", back_populates="category_rel")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    merchant = Column(String, nullable=True)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    payment_method = Column(String, default="Cash")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="expenses")
    category_rel = relationship("Category", back_populates="expenses")


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    source = Column(String, nullable=False)
    description = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="incomes")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="budgets")
    category_rel = relationship("Category", back_populates="budgets")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=True)
    due_date = Column(String, nullable=False)
    reminder_date = Column(String, nullable=False)
    priority = Column(String, default="medium")
    repeat = Column(String, default="one_time")
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="reminders")
