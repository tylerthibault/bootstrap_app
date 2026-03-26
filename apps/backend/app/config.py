import os


class BaseConfig:
  SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
  SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///bootstrap.db")
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8081").split(",") if origin.strip()]


class DevelopmentConfig(BaseConfig):
  DEBUG = True


class ProductionConfig(BaseConfig):
  DEBUG = False


def get_config():
  env = os.getenv("FLASK_ENV", "development").lower()
  if env == "production":
    return ProductionConfig
  return DevelopmentConfig
