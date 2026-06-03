from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Twilio
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str

    # Deepgram
    DEEPGRAM_API_KEY: str

    # ElevenLabs
    ELEVENLABS_API_KEY: str
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"

    # Anthropic (replaces OpenAI)
    ANTHROPIC_API_KEY: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./data/chromadb"

    # SQLite
    SQLITE_DB_PATH: str = "./data/recallai.db"

    # App
    BASE_URL: str
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
