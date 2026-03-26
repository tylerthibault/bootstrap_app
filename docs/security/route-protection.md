# Route Protection

This project protects admin functionality at both API and app-navigation layers.

## Backend API protection

Protected route:
- `GET /api/admin/`

Guard behavior:
- Requires permission `admin:access`
- Reads caller identity from Bearer access token
- Resolves caller roles from database
- Returns:
  - `401` when token is missing/invalid
  - `403` when role is insufficient

Denied access attempts are logged to `activity_logs` and `audit_logs`.

## Mobile route protection

Protected route:
- `AdminDashboard`

Guard behavior in navigation:
- Role is resolved from `EXPO_PUBLIC_APP_ROLE`
- `admin` role sees `AdminDashboardScreen`
- Non-admin role is shown a forbidden guard screen for the same route

Default behavior:
- If `EXPO_PUBLIC_APP_ROLE` is not set to `admin`, app treats the user as `user`.

## Local verification

1. Call `/api/admin/` without token → expect `401`.
2. Call `/api/admin/` with non-admin token → expect `403`.
3. Call `/api/admin/` with admin token → expect `200`.
4. Open `AdminDashboard` with `EXPO_PUBLIC_APP_ROLE=user` → forbidden screen.
5. Open `AdminDashboard` with `EXPO_PUBLIC_APP_ROLE=admin` → admin screen.
