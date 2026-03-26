# Web + Backend Release Checklist

This checklist covers production release readiness for SEO web deployment and backend deployment.

## 1) Pre-release validation (must pass)

Run from repository root:

```bash
npm run release:validate
```

Blocking behavior:
- Release is blocked when lint/test/build/security checks fail.

## 2) Backend deployment readiness

- Confirm `apps/backend/.env` production values are set.
- Ensure `SECRET_KEY` is secure and rotated as needed.
- Validate DB connectivity and migration readiness.

Deploy command example:

```bash
cd apps/backend
python3 run.py
```

(Replace with your production process manager/container command.)

## 3) Web SEO deployment readiness

- Confirm `apps/web-seo/.env.local` production values are set.
- Validate public metadata URLs and canonical host values.
- Build check must pass:

```bash
npm run --workspace @smn/web-seo build
```

Deploy command example:

```bash
npm run --workspace @smn/web-seo start
```

## 4) Post-deploy checks

- Backend health endpoints:
  - `/health`
  - `/ready`
- Public pages load:
  - `/`
  - `/features`
  - `/docs`
  - `/privacy`
  - `/terms`
- `robots.txt` and `sitemap.xml` resolve correctly.

## 5) Security checks

- Confirm repository security gate passed (`node ./scripts/security-check.mjs`).
- Confirm no secrets or tokens are present in committed files.

## 6) Release notes and rollback

- Generate release notes from template:

```bash
npm run release:notes
```

- Record backend and web rollback commands before deployment.
