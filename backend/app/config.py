from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pharmacy Management System"
    MONGODB_URL: str = "mongodb://localhost:27017" # Default for local dev, or Atlas URL
    DATABASE_NAME: str = "pharmacy_db"
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 1 day

    class Config:
        env_file = ".env"

settings = Settings()
