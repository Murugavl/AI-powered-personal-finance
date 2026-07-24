import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGO_URL: str = "mongodb://localhost:27017/AI_Finance"
    
    # JWT Authentication Configuration
    JWT_SECRET: str = "finance_app_super_secret_key_2024_xK9mP2nQ"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # Tool Paths (Environment Variables)
    TESSERACT_PATH: str = "tesseract"
    WKHTMLTOPDF_PATH: str = "wkhtmltopdf"
    
    # App Settings
    ENV: str = "development"
    DEBUG: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
