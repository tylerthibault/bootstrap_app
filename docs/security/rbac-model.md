# RBAC Model

This project uses role-based access control with two baseline roles: `user` and `admin`.

## Roles

- `user`
- `admin`

`admin` inherits all baseline `user` capabilities and adds elevated permissions.

## Baseline permissions

### user
- `session:self:read`
- `session:self:revoke`
- `profile:self:read`
- `profile:self:update`

### admin
- All `user` permissions
- `admin:access`
- `admin:user:read`
- `admin:user:update`
- `admin:role:assign`
- `admin:session:revoke`
- `admin:audit:read`

## Identity source

- API clients send `Authorization: Bearer <access_token>`.
- Access token claims are validated using the backend `SECRET_KEY`.
- User roles are resolved from `user_roles` + `roles` tables for each protected request.

## Enforcement

- Backend permission checks use a permission guard decorator.
- Admin API routes require `admin:access`.

## Forbidden/unauthorized responses

All failures use consistent error envelopes:
- `401 UNAUTHORIZED` when authentication is missing/invalid
- `403 FORBIDDEN` when authenticated but missing required permission

Response shape:
- `{ "ok": false, "error": { "code": "...", "message": "...", "details": { ... } } }`

## Denied access logging

Denied access attempts are persisted to:
- `activity_logs` with action `access_denied`
- `audit_logs` with action `access_denied`

Logged metadata includes required permission, HTTP method, path, and caller roles.
