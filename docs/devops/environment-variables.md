# Environment Variables

Step 13 environment templates are provided for backend, mobile, and web.

## Template files

- `apps/backend/.env.example`
- `apps/mobile/.env.example`
- `apps/web-seo/.env.example`

## Local bootstrap

Run from repository root:

```bash
npm run bootstrap
```

Bootstrap behavior:
- Copies template env files when missing:
  - `apps/backend/.env`
  - `apps/mobile/.env`
  - `apps/web-seo/.env.local`
- Installs backend Python dependencies.

## Secret management

- Never commit real secrets.
- Keep runtime secrets in local env files or deployment secret stores.
- Rotate leaked secrets immediately.

## Non-committed env files

Ignored by git (`.gitignore`):
- `.env`
- `.env.*` (except `.env.example`)
- `apps/web-seo/.env.local`

## Minimal required variables

### Backend (`apps/backend/.env`)
- `FLASK_ENV`
- `SECRET_KEY`
- `DATABASE_URL`
- `CORS_ORIGINS`

### Mobile (`apps/mobile/.env`)
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_ACCESS_TOKEN`
- `EXPO_PUBLIC_REFRESH_TOKEN`
- `EXPO_PUBLIC_APP_ROLE`

### Web SEO (`apps/web-seo/.env.local`)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
