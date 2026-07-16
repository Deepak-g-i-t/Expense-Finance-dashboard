from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import database, models
from routers import auth, expenses, income, budgets, reminders, dashboard, analytics, settings, categories

app = FastAPI(
    title="Personal Expense Analytics API",
    description="A secure, personal expense tracking and analytics API",
    version="1.0.0",
)

import os
from dotenv import load_dotenv

load_dotenv()
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Path("./data").mkdir(exist_ok=True)
    models.Base.metadata.create_all(bind=database.engine)


# Register all routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(budgets.router)
app.include_router(reminders.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(settings.router)
app.include_router(categories.router)


@app.get("/")
def root():
    return {"message": "Personal Expense Analytics API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
