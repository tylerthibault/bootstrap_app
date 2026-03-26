# Web App Getting Started

## Purpose
`apps/web-app` is the authenticated browser product application (separate from `apps/web-seo` marketing pages).

## Prerequisites
- Node.js and npm installed
- Backend API running locally

## Environment

Template file:
- `apps/web-app/.env.example`

Required variable:
- `NEXT_PUBLIC_API_BASE_URL` (example: `http://127.0.0.1:5299`)

## Local Run
1. Install dependencies from repository root:

```bash
npm install
```

2. Start backend in one terminal:

```bash
python3 apps/backend/run.py
```

3. Start browser web app in another terminal:

```bash
npm run --workspace @smn/web-app dev
```

4. Open:
- `http://localhost:3001/login`
- `http://localhost:3001/register`
- `http://localhost:3001/dashboard`
- `http://localhost:3001/admin`

5. Optional: run SEO app in parallel:

```bash
npm run --workspace @smn/web-seo dev
```

SEO app uses port `3000`, browser app uses port `3001`.

## Notes
- Keep `apps/web-seo` for public, indexable pages only.
- Keep `apps/web-app` for authenticated product flows.
