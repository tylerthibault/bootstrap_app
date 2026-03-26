# Migrations and Seeds

Step 5 migration assets:

- [apps/backend/migrations/versions/0001_initial_schema.sql](apps/backend/migrations/versions/0001_initial_schema.sql)
- [apps/backend/migrations/versions/0002_seed_roles.sql](apps/backend/migrations/versions/0002_seed_roles.sql)

## Seed data

`0002_seed_roles.sql` inserts baseline roles:

- `user`
- `admin`

The inserts are idempotent and skip existing role rows.

## Execution note

These SQL migration files can be applied in order on a fresh database. Runtime execution is environment-dependent on local DB tooling.
