# Idle Timeout Policy

Idle timeout is enforced from backend session activity timestamps.

## Configuration

Set in backend environment:
- `IDLE_WARNING_TIMEOUT_SECONDS` (default: `900`)
- `IDLE_HARD_TIMEOUT_SECONDS` (default: `1800`)

## Behavior

- Protected API routes evaluate inactivity for the current user.
- Inactivity is computed from the latest `sessions.last_activity_at` among active sessions.
- When inactivity reaches warning timeout:
  - request is allowed
  - response includes warning headers:
    - `X-Idle-Warning: true`
    - `X-Idle-Inactive-Seconds`
    - `X-Idle-Warning-Timeout-Seconds`
- When inactivity reaches hard timeout:
  - all active sessions are revoked (`revoked_at` set)
  - route returns `401` with error code `SESSION_IDLE_TIMEOUT`

## Auto-logout effect

When hard timeout is reached, refresh sessions are invalidated so the client can no longer refresh or continue protected operations until re-authentication.

## Client heartbeat expectation

Clients should periodically call:
- `POST /api/logs/activity/heartbeat`

Recommended heartbeat interval:
- 60 seconds

Request payload may include:
- `action` (defaults to `heartbeat`)
- `route`
- `refresh_token` (preferred to update specific session)
- `metadata`
