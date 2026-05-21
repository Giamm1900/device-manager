try:
    # pydantic v1 exposed BaseSettings from pydantic
    from pydantic import BaseSettings
except Exception:
    # pydantic v2 moved settings helpers to pydantic_settings
    from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    class Config:
        env_file = ".env.local"
        extra = "ignore"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5434/device-manager"
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
