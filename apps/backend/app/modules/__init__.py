from flask import Flask

from .admin.routes import admin_bp
from .auth.routes import auth_bp
from .health.routes import health_bp
from .logs.routes import logs_bp
from .roles.routes import roles_bp
from .sessions.routes import sessions_bp
from .users.routes import users_bp


def register_blueprints(app: Flask) -> None:
  app.register_blueprint(health_bp)
  app.register_blueprint(auth_bp, url_prefix="/api/auth")
  app.register_blueprint(users_bp, url_prefix="/api/users")
  app.register_blueprint(roles_bp, url_prefix="/api/roles")
  app.register_blueprint(sessions_bp, url_prefix="/api/sessions")
  app.register_blueprint(logs_bp, url_prefix="/api/logs")
  app.register_blueprint(admin_bp, url_prefix="/api/admin")
