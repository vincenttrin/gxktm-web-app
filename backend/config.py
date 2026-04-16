import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase Configuration
    supabase_url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", ""))
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # CORS Origins
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    # Enrollment confirmation email (Supabase Edge Function)
    supabase_enrollment_confirmation_function_url: str = os.getenv(
        "SUPABASE_ENROLLMENT_CONFIRMATION_FUNCTION_URL",
        f"{os.getenv('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')}/functions/v1/registration-confirmation-email"
        if os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        else "",
    )
    supabase_enrollment_confirmation_function_secret: str = os.getenv(
        "SUPABASE_ENROLLMENT_CONFIRMATION_FUNCTION_SECRET",
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
    )
    supabase_enrollment_confirmation_timeout_seconds: int = int(
        os.getenv("SUPABASE_ENROLLMENT_CONFIRMATION_TIMEOUT_SECONDS", "8")
    )
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
