# Web App Routing and Layout

## Route Intent
- Public auth routes:
  - `/login`
  - `/register`
- Product shell routes:
  - `/dashboard` (user dashboard shell)
  - `/admin` (admin dashboard shell)
- Root route:
  - `/` redirects to `/login`

## Guarding Model
- Step 16 provides route shells and baseline client checks:
  - token is read from browser storage
  - admin shell checks local role selection (`admin` vs `user`)
  - shell shows clear error messaging when access preconditions are not met
- Full auth + RBAC parity behavior is implemented in the next step.

## Layout
- Global layout is defined in `apps/web-app/app/layout.tsx`.
- Minimal page-level navigation links are used for shell flow.

## Shared request/config utilities

- API base URL config:
  - `apps/web-app/lib/env.ts`
- Shared request helper:
  - `apps/web-app/lib/api.ts`
- Browser token/role helpers:
  - `apps/web-app/lib/auth.ts`
