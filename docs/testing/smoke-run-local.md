# Local Smoke Run Guide

This guide validates the current scaffold for backend, SEO web, and mobile app shell.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+ (or compatible 3.x)
- `pip`
- `sqlite3`

Quick check:

```bash
node -v
npm -v
python3 --version
pip3 --version
sqlite3 --version
```

## 2. Install workspace dependencies

From repository root:

```bash
cd /home/thoril/Documents/Coding/smn_app_v1
npm install
```

Expected result:
- Install completes without fatal errors.

## 3. Backend smoke run (Flask + DB)

From backend folder:

```bash
cd /home/thoril/Documents/Coding/smn_app_v1/apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Apply SQL migrations to a fresh SQLite DB:

```bash
rm -f bootstrap.db
sqlite3 bootstrap.db < migrations/versions/0001_initial_schema.sql
sqlite3 bootstrap.db < migrations/versions/0002_seed_roles.sql
sqlite3 bootstrap.db "select name from roles order by name;"
```

Expected result:
- Query output includes:
  - `admin`
  - `user`

Run backend:

```bash
python run.py
```

In another terminal, verify health:

```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/ready
```

Expected result:
- `health` returns JSON with `status: ok`
- `ready` returns JSON with `status: ready`

## 4. SEO web smoke run (Next.js)

From web SEO folder:

```bash
cd /home/thoril/Documents/Coding/smn_app_v1/apps/web-seo
npm install
npm run dev
```

Open in browser:
- http://localhost:3000/
- http://localhost:3000/features
- http://localhost:3000/docs
- http://localhost:3000/privacy
- http://localhost:3000/terms

Expected result:
- Each route loads without server crash.

Optional metadata checks:
- http://localhost:3000/robots.txt
- http://localhost:3000/sitemap.xml

## 5. Mobile shell smoke run (Expo)

From mobile folder:

```bash
cd /home/thoril/Documents/Coding/smn_app_v1/apps/mobile
npm install
npm run web
```

Expected result:
- Expo starts and opens the app shell in browser.
- Placeholder screens exist in navigation:
  - Login
  - Register
  - Dashboard
  - Admin Dashboard

Optional device targets:

```bash
npm run android
npm run ios
```

## 6. Root script smoke run

From repository root:

```bash
cd /home/thoril/Documents/Coding/smn_app_v1
npm run lint
npm run test
npm run dev
```

Expected result:
- Commands execute (current scripts are placeholders until later steps).

## 7. Smoke run pass checklist

Mark smoke run as passing when all are true:
- Backend starts and health/readiness endpoints respond.
- Migrations apply and role seeds exist.
- SEO web app serves all required public routes.
- Expo app shell starts and navigation screens render.
- Root scripts execute without missing-command failures.

## 8. Common failures

- `npm: command not found`: install Node.js and npm, then reopen terminal.
- `python3: command not found`: install Python 3.
- `sqlite3: command not found`: install sqlite3 CLI.
- Port already in use: stop process using port 3000 or 5000, then rerun.
