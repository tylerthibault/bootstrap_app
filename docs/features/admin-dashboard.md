# Admin Dashboard

The admin dashboard provides operational controls for managing users, roles, sessions, and audit visibility.

## Capabilities

- User search and filtering by:
  - query (`q`) over email/display name
  - `status`
  - `role`
- User pagination for manageable browsing
- Role assignment for selected users
- Account status controls (`active` / `disabled`)
- Session revocation for selected users
- Audit log browser with action filter and pagination

## Backend endpoints used

- `GET /api/admin/users`
  - query params: `q`, `status`, `role`, `page`, `page_size`
- `PUT /api/admin/users/:user_id/roles`
- `PATCH /api/admin/users/:user_id/status`
- `POST /api/admin/users/:user_id/sessions/revoke`
- `GET /api/admin/audit-logs`
  - query params: `action`, `page`, `page_size`

## Mobile screen

Implementation: `apps/mobile/src/screens/AdminDashboardScreen.tsx`

The screen includes:
- API base URL + admin token inputs
- User list controls and selection
- Role assignment form
- Status update control
- Session revocation action
- Audit logs list with filter + pagination

## Safe confirmations

Destructive actions require confirmation prompts:
- status update
- session revocation

These confirmations are implemented with React Native `Alert` before API mutation calls are sent.
