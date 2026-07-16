# ExpenseIQ — Personal Finance Analytics

A full-stack personal expense analytics web application with a premium dark-mode UI, FastAPI backend, SQLite database, and automatic Excel backup.

## Quick Start

### 1. Start the Backend
```bash
# Open a terminal in the expense calculator directory
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Or double-click `start-backend.bat`

### 2. Start the Frontend
```bash
# Open another terminal
cd frontend
npm run dev
```
Or double-click `start-frontend.bat`

### 3. Open the App
Navigate to: **http://localhost:5173**

---

## Project Structure

```
expense calculator/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── database.py      # SQLite session setup
│   ├── security.py      # JWT + bcrypt auth
│   ├── config.py        # App settings
│   ├── excel_sync.py    # openpyxl Excel backup
│   └── routers/
│       ├── auth.py
│       ├── expenses.py
│       ├── income.py
│       ├── budgets.py
│       ├── reminders.py
│       ├── dashboard.py
│       ├── analytics.py
│       ├── settings.py
│       └── categories.py
├── frontend/
│   └── src/
│       ├── pages/       # All page components
│       ├── components/  # Shared components (Sidebar)
│       ├── store/       # Zustand auth store
│       ├── lib/         # Axios API client
│       └── types/       # TypeScript types
├── start-backend.bat
└── start-frontend.bat
```

## API Documentation

Visit **http://localhost:8000/docs** for interactive Swagger UI.

## Data Files

- **Database:** `backend/expense_analytics.db` (SQLite)
- **Excel Backup:** `backend/data/backup.xlsx` (auto-synced on every write)
- **Exports:** `backend/data/export_*.xlsx` and `.csv`
