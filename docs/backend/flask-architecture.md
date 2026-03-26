# Flask Architecture

## App pattern

The backend uses an app-factory pattern in [apps/backend/app/__init__.py](apps/backend/app/__init__.py) with `create_app()`.

## Modules

Blueprint modules are scaffolded under [apps/backend/app/modules](apps/backend/app/modules):

- `auth`
- `users`
- `roles`
- `sessions`
- `logs`
- `admin`
- `health`

Each module currently exposes a minimal status endpoint.

## Extensions

Shared Flask extensions are centralized in [apps/backend/app/extensions.py](apps/backend/app/extensions.py):

- SQLAlchemy
- Flask-Migrate
- Flask-CORS

## Health and readiness

- `GET /health`
- `GET /ready`

Both are defined in [apps/backend/app/modules/health/routes.py](apps/backend/app/modules/health/routes.py).
