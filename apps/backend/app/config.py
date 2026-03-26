import os


class BaseConfig:
  SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
  SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///bootstrap.db")
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
      "CORS_ORIGINS",
      "http://localhost:3000,http://localhost:3001,http://localhost:3199,http://localhost:8081",
    ).split(",")
    if origin.strip()
  ]
  REFRESH_TOKEN_TTL_DAYS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "30"))
  PASSWORD_RESET_TTL_SECONDS = int(os.getenv("PASSWORD_RESET_TTL_SECONDS", "3600"))
  EMAIL_VERIFICATION_TTL_SECONDS = int(os.getenv("EMAIL_VERIFICATION_TTL_SECONDS", str(60 * 60 * 24 * 2)))
  IDLE_WARNING_TIMEOUT_SECONDS = int(os.getenv("IDLE_WARNING_TIMEOUT_SECONDS", "900"))
  IDLE_HARD_TIMEOUT_SECONDS = int(os.getenv("IDLE_HARD_TIMEOUT_SECONDS", "1800"))


class DevelopmentConfig(BaseConfig):
  DEBUG = True


class ProductionConfig(BaseConfig):
  DEBUG = False


def get_config():
  env = os.getenv("FLASK_ENV", "development").lower()
  if env == "production":
    return ProductionConfig
  return DevelopmentConfig
