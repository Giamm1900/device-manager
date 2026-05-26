import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Trova la cartella 'backend' risalendo di un livello rispetto a config.py
current_dir = os.path.dirname(os.path.abspath(__file__)) # cartella 'app'
parent_dir = os.path.dirname(current_dir)                # cartella 'backend'
env_path = os.path.join(parent_dir, ".env.local")

class Settings(BaseSettings):
    # In Docker (docker-compose) si passa direttamente DATABASE_URL.
    # In locale (.env.local) si passano le tre parti separate.
    DATABASE_URL: str | None = None
    DB_USERNAME: str | None = None
    DB_PASSWORD: str | None = None
    DB_URL: str | None = None
    cors_origins: list[str] = ["http://localhost:5173"]

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        # Priorità a DATABASE_URL completo (usato da docker-compose)
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.DB_USERNAME and self.DB_PASSWORD and self.DB_URL:
            # psycopg v3, coerente col dump ripristinato
            return (
                f"postgresql+psycopg://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_URL}"
            )
        raise ValueError(
            "Configurazione DB mancante: imposta DATABASE_URL "
            "oppure DB_USERNAME, DB_PASSWORD e DB_URL"
        )

    # Usiamo il percorso assoluto dinamico che abbiamo calcolato sopra
    model_config = SettingsConfigDict(
        env_file=env_path,
        extra="ignore",
    )

settings = Settings()