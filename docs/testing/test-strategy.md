# Test Strategy

Step 12 test strategy focuses on critical auth, session, RBAC, and frontend auth/dashboard flow paths.

## Scope

### Backend integration tests

Location:

- `apps/backend/tests/test_auth_session_rbac.py`

Coverage:

- Auth refresh token rotation behavior.
- RBAC enforcement on admin endpoints (`401`, `403`, `200` paths).
- Idle timeout integration behavior:
  - warning threshold response headers,
  - heartbeat activity logging,
  - hard-timeout auto-revocation and `SESSION_IDLE_TIMEOUT` response.

### Frontend critical flow tests

Location:

- `apps/mobile/tests/auth-dashboard-flows.test.mjs`

Coverage:

- Auth attempt preconditions (email/password required).
- Dashboard load preconditions (API URL and access token required).
- Current-session logout preconditions (refresh token required).

## Quality gates

Quality gates are enforced by:

- `npm run lint`
- `npm run test`

CI workflow:

- `.github/workflows/quality-gates.yml`

PR/branch gates run lint + tests before merge.

## Integration tests explicitly included

The suite includes integration tests for:

- Refresh token rotation.
- Idle timeout warning/hard-timeout auto-logout behavior.
