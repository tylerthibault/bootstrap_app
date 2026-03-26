# Web App Auth and RBAC

## Auth Flows
- `POST /api/auth/register` creates browser user sessions and stores access/refresh tokens in browser storage.
- `POST /api/auth/login` signs in with email/password, then hydrates role claims from `GET /api/users/me`.
- `POST /api/auth/refresh` is used automatically when protected requests receive `401`.
- Logout supports current-session and all-session revocation via backend logout endpoints and storage clear.

All flows should use existing backend auth endpoints and consistent API response envelopes.

## RBAC Expectations
- User routes require an active session; expired sessions are refreshed once before redirecting to login.
- Admin route access is derived from backend role claims (`/api/users/me`), not local route toggles.
- Non-admin users receive an explicit forbidden state on `/admin`.
- Unauthorized and forbidden states are surfaced in UI with clear messages.

## Parity Goal
Browser app behavior should match existing backend policy and mobile app access control.

## Implemented Browser Guards
- `requireSession("user")` protects dashboard data flows.
- `requireSession("admin")` protects admin routes/actions and enforces forbidden state for non-admin users.
- `apiAuthedRequest(...)` retries once after refresh on `401` and clears browser session if refresh fails.
