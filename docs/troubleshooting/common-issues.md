# Common Issues

## 1) `npm run release:validate` fails at web build gate

Symptoms:
- Next.js build exits non-zero from `apps/web-seo`.

What to check:
- Run `npm run --workspace @smn/web-seo build` directly.
- Review TS type errors in output.
- Confirm `next`, `react`, and `@types/*` versions are compatible.

## 2) Backend returns `SESSION_IDLE_TIMEOUT` unexpectedly

Symptoms:
- Protected endpoints return `401` with `SESSION_IDLE_TIMEOUT`.

What to check:
- `IDLE_WARNING_TIMEOUT_SECONDS` and `IDLE_HARD_TIMEOUT_SECONDS` values.
- Confirm heartbeat requests are being sent (`POST /api/logs/activity/heartbeat`).
- Verify `refresh_token` is provided when heartbeat should target a specific session.

## 3) Admin API returns `403 FORBIDDEN`

Symptoms:
- Access token works for user endpoints but not `/api/admin/*`.

What to check:
- User has `admin` role in `user_roles`.
- Access token was issued after role assignment change.
- Route requires permission mapped in `docs/security/rbac-model.md`.

## 4) Dashboard data fails to load in mobile

Symptoms:
- Dashboard screen shows loading/errors for profile/session/activity.

What to check:
- `EXPO_PUBLIC_API_BASE_URL` points to backend host/port.
- `EXPO_PUBLIC_ACCESS_TOKEN` is current and valid.
- Backend is running and healthy (`/health`, `/ready`).

## 5) CI fails on lint or tests locally pass

Symptoms:
- Pull request CI is red for lint/test/build.

What to check:
- Re-run exact local commands:
  - `npm run lint`
  - `npm run test`
  - `npm run --workspace @smn/web-seo build`
- Confirm Python and Node versions are within documented ranges.

## 6) `bootstrap` script does not create env files

Symptoms:
- `.env` files missing after `npm run bootstrap`.

What to check:
- Ensure template files exist:
  - `apps/backend/.env.example`
  - `apps/mobile/.env.example`
  - `apps/web-seo/.env.example`
- Existing target files are intentionally not overwritten.
