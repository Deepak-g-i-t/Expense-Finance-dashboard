from pydantic import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SECRET_KEY: str = "expense-analytics-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./expense_analytics.db"
    EXCEL_BACKUP_PATH: str = "./data/backup.xlsx"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
