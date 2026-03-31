import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pharmacy Management System"
    # Prioritize MONGODB_URL or MONGODB_URI from environment
    MONGODB_URL: str = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
    DATABASE_NAME: str = "pharmacy_db"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_please_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 1 day

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
