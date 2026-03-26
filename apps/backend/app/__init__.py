from pathlib import Path

from flask import Flask
from sqlalchemy import inspect, text

from .config import get_config
from .extensions import cors, db, migrate
from .modules import register_blueprints


def _is_sqlite_uri(uri: str | None) -> bool:
  return bool(uri and uri.startswith("sqlite"))


def _bootstrap_sqlite_schema_if_missing(app: Flask) -> None:
  database_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
  if not _is_sqlite_uri(database_uri):
    return

  inspector = inspect(db.engine)
  if inspector.has_table("users") and inspector.has_table("roles"):
    return

  migrations_dir = Path(__file__).resolve().parents[1] / "migrations" / "versions"
  schema_path = migrations_dir / "0001_initial_schema.sql"
  seed_path = migrations_dir / "0002_seed_roles.sql"

  if not schema_path.exists() or not seed_path.exists():
    raise RuntimeError("Database bootstrap files are missing in migrations/versions")

  schema_sql = schema_path.read_text()
  seed_sql = seed_path.read_text()

  with db.engine.begin() as connection:
    for statement in schema_sql.split(";"):
      stripped = statement.strip()
      if stripped:
        connection.execute(text(stripped))
    for statement in seed_sql.split(";"):
      stripped = statement.strip()
      if stripped:
        connection.execute(text(stripped))


def create_app() -> Flask:
  app = Flask(__name__)
  app.config.from_object(get_config())

  db.init_app(app)
  migrate.init_app(app, db)
  cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})

  with app.app_context():
    _bootstrap_sqlite_schema_if_missing(app)

  register_blueprints(app)

  return app
