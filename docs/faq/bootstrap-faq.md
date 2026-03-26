# Bootstrap FAQ

## What is this repository for?

It is a cross-platform starter with:
- Flask backend API
- Expo mobile app
- Next.js SEO web app
- browser web-app docs and planning path
- CI/test/release check scaffolding

## Do I need both mobile and web apps?

Usually yes for this starter:
- `apps/mobile` targets iOS/Android app users.
- `apps/web-seo` targets public discovery and SEO pages.

They typically share the same backend APIs.

## Where should I start on a fresh clone?

1. `npm install`
2. `npm run bootstrap`
3. `npm run lint`
4. `npm run test`
5. `npm run dev`

See `docs/setup/local-development.md` and `docs/index.md`.

## How do I run release-readiness checks?

Use:

```bash
npm run release:validate
```

This blocks release when lint/test/build/security checks fail.

## Where are API auth and token lifecycle docs?

- `docs/auth/api-endpoints.md`
- `docs/auth/token-lifecycle.md`

## Where is RBAC and route protection documented?

- `docs/security/rbac-model.md`
- `docs/security/route-protection.md`

## How do I troubleshoot common setup and runtime issues?

Use:
- `docs/troubleshooting/common-issues.md`

## Are secrets committed to this repository?

No. Use template files (`.env.example`) and local env files (`.env`, `.env.local`) that are ignored by git.
