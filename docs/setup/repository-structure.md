# Repository Structure

This repository uses a monorepo layout for mobile, web, backend, and shared packages.

## Top-level directories

- `apps/mobile`: Expo app (Android, iOS, web app-shell)
- `apps/web-seo`: SEO-focused web frontend
- `apps/backend`: Flask API
- `packages/shared`: shared types/utilities used across apps
- `packages/config`: shared lint/build/tooling config
- `docs`: technical and operational documentation
- `.github`: repository automation and templates

## Why this structure

- Clear separation by runtime and deployment target.
- Shared code can be versioned centrally in `packages/*`.
- Easy onboarding for future projects cloned from this bootstrap.
