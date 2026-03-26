# Environment Configuration

## Files

- Example environment file: [apps/backend/.env.example](apps/backend/.env.example)
- Config loader: [apps/backend/app/config.py](apps/backend/app/config.py)

## Supported variables

- `FLASK_ENV`: `development` or `production`
- `SECRET_KEY`: app secret key
- `DATABASE_URL`: SQLAlchemy database URL
- `CORS_ORIGINS`: comma-separated list of allowed origins

## Migrations

Migration workflow notes are documented in [apps/backend/migrations/README.md](apps/backend/migrations/README.md).

## Runtime note

Backend startup and migration commands require Python and pip tooling in the local shell.
