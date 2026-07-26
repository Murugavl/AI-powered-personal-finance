import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGO_URL: str
    
    # JWT Authentication Configuration
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    GEMINI_API_KEY: str
    GROQ_API_KEY: str = ""  # Add your GROQ key at https://console.groq.com
    
    # CORS Allowed Origins (Comma-separated)
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
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
