from flask import Flask

from .config import get_config
from .extensions import cors, db, migrate
from .modules import register_blueprints


def create_app() -> Flask:
  app = Flask(__name__)
  app.config.from_object(get_config())

  db.init_app(app)
  migrate.init_app(app, db)
  cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})

  register_blueprints(app)

  return app
