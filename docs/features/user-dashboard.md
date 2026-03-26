# User Dashboard

The user dashboard provides authenticated users with account visibility and session controls.

## Scope

The dashboard screen shows:
- Profile basics
- Recent activity list
- Active sessions list
- Account actions:
  - Logout current session
  - Logout all sessions

## Backend APIs used

- `GET /api/users/me`
  - Returns current user profile basics.
- `GET /api/logs/activity/recent?limit=10`
  - Returns recent activity for current user.
- `GET /api/sessions/me`
  - Returns current user sessions.
- `POST /api/sessions/current/logout`
  - Revokes current refresh session (`refresh_token` required).
- `POST /api/sessions/all/logout`
  - Revokes all active sessions for current user.

## Mobile implementation

`apps/mobile/src/screens/DashboardScreen.tsx`:
- Uses API-backed fetch calls for profile, sessions, and activity.
- Includes loading and error states.
- Includes action buttons for current/all session logout.
- Supports local API configuration through:
  - `EXPO_PUBLIC_API_BASE_URL`
  - `EXPO_PUBLIC_ACCESS_TOKEN`
  - `EXPO_PUBLIC_REFRESH_TOKEN`

## Local smoke sequence

1. Obtain tokens from auth endpoints (`register` or `login`).
2. Open Dashboard screen and set API base URL + access token + refresh token.
3. Tap **Load Dashboard** and verify profile/sessions/activity render.
4. Tap **Logout Current Session** and verify session state updates.
5. Tap **Logout All Sessions** and verify sessions are revoked.
