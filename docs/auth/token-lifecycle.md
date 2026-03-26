# Token Lifecycle

This backend uses short-lived signed access tokens and server-tracked refresh sessions.

## Access tokens
- Signed using app `SECRET_KEY`
- Payload includes user id/email and `type=access`
- Returned on `register`, `login`, and `refresh`

## Refresh tokens
- Generated as high-entropy random strings
- Only SHA-256 hash is stored in `sessions.refresh_token_hash`
- Each login/register creates a new active session row
- Each refresh performs rotation:
  - old session is revoked (`revoked_at` set)
  - new session + new refresh token are created

## Session revocation
- `POST /api/auth/logout` revokes one refresh session
- `POST /api/auth/logout-all` revokes every active session for that user
- `POST /api/auth/password-reset/confirm` revokes all active sessions for safety

## Verification and reset tokens
- Email verification token is signed (`type=email_verification`)
- Password reset token is signed (`type=password_reset`)
- Both enforce max age via config:
  - `EMAIL_VERIFICATION_TTL_SECONDS` (default 2 days)
  - `PASSWORD_RESET_TTL_SECONDS` (default 1 hour)

## Config knobs
- `REFRESH_TOKEN_TTL_DAYS` (default `30`)
- `PASSWORD_RESET_TTL_SECONDS` (default `3600`)
- `EMAIL_VERIFICATION_TTL_SECONDS` (default `172800`)
