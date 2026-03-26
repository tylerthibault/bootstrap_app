# User Management

Admin user management is implemented through RBAC-protected admin APIs and dashboard controls.

## Admin operations

### 1) Search and filter users
`GET /api/admin/users`
- Supports `q`, `status`, `role`
- Supports pagination with `page` and `page_size`

### 2) Assign roles
`PUT /api/admin/users/:user_id/roles`
- Request body: `{ "roles": ["user", "admin"] }`
- Replaces current role mappings for the target user

### 3) Update account status
`PATCH /api/admin/users/:user_id/status`
- Request body: `{ "status": "active" | "disabled" }`

### 4) Revoke sessions
`POST /api/admin/users/:user_id/sessions/revoke`
- Without `session_id`: revokes all active sessions for that user
- With `session_id`: revokes one active session for that user

## Audit requirements

Every admin mutation writes an `audit_logs` row:
- role assignment
- status update
- session revocation

Audit entries include:
- `actor_user_id`
- `target_user_id`
- `action`
- `before_json`
- `after_json`

## Permissions

These operations require admin permissions from RBAC model:
- `admin:user:read`
- `admin:role:assign`
- `admin:user:update`
- `admin:session:revoke`
- `admin:audit:read`
