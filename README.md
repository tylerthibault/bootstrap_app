# smn_app_v1

Cross-platform bootstrap starter for mobile, web SEO, and backend API development.

## Architecture overview

- `apps/backend`: Flask API with auth, sessions, RBAC, activity logging, and admin tooling.
- `apps/mobile`: Expo app shell with auth-aware user/admin dashboard flows.
- `apps/web-seo`: Next.js public site with metadata, robots, and sitemap support.
- `docs`: setup, security, testing, release, and operations documentation.

Start with the full docs index: `docs/index.md`.

## Quick start

From repository root:

```bash
npm install
npm run bootstrap
npm run lint
npm run test
npm run dev
```

## Root scripts

- `npm run install`: post-install guidance
- `npm run bootstrap`: creates local env files and installs backend Python dependencies
- `npm run lint`: syntax + formatting quality checks
- `npm run test`: backend integration and frontend flow tests
- `npm run dev`: starts backend + mobile + web-seo dev servers
- `npm run release:validate`: pre-release blocking gates (lint/test/build/security)
- `npm run release:notes`: prints release-notes template

## Documentation map

- Setup: `docs/setup/local-development.md`
- Backend: `docs/backend/flask-architecture.md`
- Security: `docs/security/rbac-model.md`
- Testing: `docs/testing/test-strategy.md`
- Release: `docs/release/mobile-release-checklist.md`, `docs/release/web-backend-release-checklist.md`
- Troubleshooting: `docs/troubleshooting/common-issues.md`
- FAQ: `docs/faq/bootstrap-faq.md`
