# Auth API Endpoints

Base path: `/api/auth`

All responses use a consistent envelope:
- Success: `{ "ok": true, "data": { ... } }`
- Error: `{ "ok": false, "error": { "code": "...", "message": "...", "details"?: { ... } } }`

## POST `/register`
Creates a local user account and starts a session.

Request body:
- `email` (string, required)
- `password` (string, required, min 8 chars)
- `display_name` (string, optional)

Response:
- `201 Created` with `user`, `tokens`, and `email_verification.token`

## POST `/login`
Authenticates with email/password and creates a refresh session.

Request body:
- `email` (string, required)
- `password` (string, required)

Response:
- `200 OK` with `user` and `tokens`

## POST `/refresh`
Rotates refresh tokens and returns a new access/refresh pair.

Request body:
- `refresh_token` (string, required)

Response:
- `200 OK` with `user`, `tokens`, and `rotated_from_session_id`

Errors:
- `401` for invalid/revoked/expired refresh token

## POST `/logout`
Revokes the provided refresh token session.

Request body:
- `refresh_token` (string, required)

Response:
- `200 OK` with `logged_out: true`

## POST `/logout-all`
Revokes all active sessions for the user inferred from the provided refresh token.

Request body:
- `refresh_token` (string, required)

Response:
- `200 OK` with `logged_out_all: true`

## POST `/password-reset/request`
Requests a password reset token.

Request body:
- `email` (string, required)

Response:
- `200 OK` with a generic success message
- Includes `reset_token` when the account exists

## POST `/password-reset/confirm`
Confirms a password reset with token + new password.

Request body:
- `token` (string, required)
- `new_password` (string, required, min 8 chars)

Response:
- `200 OK` with `password_reset: true`

Errors:
- `401` for invalid/expired token

## POST `/verify-email`
Verifies email ownership via signed verification token.

Request body:
- `token` (string, required)

Response:
- `200 OK` with `email_verified: true`

Errors:
- `401` for invalid/expired token
