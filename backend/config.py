import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase Configuration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # CORS Origins
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    
    # JWT Configuration
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    magic_link_expire_minutes: int = int(os.getenv("MAGIC_LINK_EXPIRE_MINUTES", "30"))
    
    # First Admin Setup
    first_admin_setup_key: str = os.getenv("FIRST_ADMIN_SETUP_KEY", "")
    
    # Frontend URL (for magic link emails)
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
