# Web App Dashboard Flows

## User Dashboard
- Loads profile (`GET /api/users/me`), recent activity (`GET /api/logs/activity/recent`), and sessions (`GET /api/sessions/me`).
- Provides actions for `POST /api/sessions/current/logout` and `POST /api/sessions/all/logout`.
- Falls back to login with explicit messaging when session refresh fails.

## Admin Dashboard
- Loads admin viewer data, user list, and audit logs from `/api/admin/*` endpoints.
- Supports user query/status/role filtering for admin user listing.
- Supports role assignment, status updates, and session revocation actions for selected users.
- Blocks non-admin users with explicit forbidden state.

## UX Baseline
- Loading states
- Error states
- Clear forbidden handling for non-admin users

Current browser implementation keeps UI minimal and includes loading/error messaging for all data loads and mutation actions.
