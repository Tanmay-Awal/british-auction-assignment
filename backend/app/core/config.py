from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "gocomet_auction"
    DATABASE_URL: Optional[str] = None
    SYNC_DATABASE_URL: Optional[str] = None
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_async_db_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        user = quote_plus(self.DB_USER)
        pwd = quote_plus(self.DB_PASSWORD)
        return f"postgresql+asyncpg://{user}:{pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    def get_sync_db_url(self) -> str:
        if self.SYNC_DATABASE_URL:
            return self.SYNC_DATABASE_URL
        user = quote_plus(self.DB_USER)
        pwd = quote_plus(self.DB_PASSWORD)
        return f"postgresql://{user}:{pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()
