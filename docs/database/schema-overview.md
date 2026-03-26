# Schema Overview

Step 5 adds the baseline bootstrap schema under [apps/backend/migrations/versions/0001_initial_schema.sql](apps/backend/migrations/versions/0001_initial_schema.sql).

## Tables

- `users`: core account records
- `roles`: role catalog
- `user_roles`: user-to-role mappings
- `oauth_accounts`: external provider identities
- `sessions`: refresh/session tracking
- `activity_logs`: user interaction log events
- `audit_logs`: privileged action audit trail

## Index coverage

The migration includes indexes for required lookup paths:

- email uniqueness (`users.email`)
- role mappings (`user_roles.user_id`, `user_roles.role_id`)
- session token lookup (`sessions.refresh_token_hash`)
- log timestamps (`activity_logs.created_at`, `audit_logs.created_at`)
