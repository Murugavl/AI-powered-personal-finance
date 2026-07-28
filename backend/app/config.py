import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically locate and load the .env file from root or backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017/AI_Finance")
    
    # JWT Authentication Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "default_secret_key_change_in_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
    
    # AI API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # CORS Allowed Origins
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
    # Tool Paths
    TESSERACT_PATH: str = os.getenv("TESSERACT_PATH", "tesseract")
    WKHTMLTOPDF_PATH: str = os.getenv("WKHTMLTOPDF_PATH", "wkhtmltopdf")
    
    # App Settings
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
