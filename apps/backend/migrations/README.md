# Migrations

This directory is reserved for Flask-Migrate migration scripts.

When Python tooling is available:

1. Install dependencies from `requirements.txt`.
2. Set `FLASK_APP=run.py`.
3. Run `flask db init` (first time only).
4. Run `flask db migrate -m \"Initial schema\"`.
5. Run `flask db upgrade`.
