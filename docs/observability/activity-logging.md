# Activity Logging

Activity events are persisted to `activity_logs`.

## Heartbeat logging

Endpoint:
- `POST /api/logs/activity/heartbeat`

RBAC requirement:
- `session:self:read`

Processing behavior:
- Logs activity action/route/metadata into `activity_logs`.
- Updates `sessions.last_activity_at`:
  - If `refresh_token` is provided and valid, updates that specific active session.
  - Otherwise updates all active sessions for the caller.

Response:
- `{ "ok": true, "data": { "heartbeat_logged": true, "session_id": <id|null> } }`

## Recent activity browsing

Endpoint:
- `GET /api/logs/activity/recent?limit=10`

Returns recent activity rows for the authenticated user.

## Idle-timeout observability

When hard idle timeout is enforced, backend writes:
- `activity_logs.action = "idle_timeout_enforced"`
- `metadata_json` includes inactivity and timeout values

This provides traceability for automatic session revocation events.
