# Mobile Release Checklist

This checklist is for Expo Android/iOS release readiness.

## 1) Pre-release gates (must pass)

Run from repository root:

```bash
npm run release:validate
```

Blocking behavior:
- If lint, tests, build, or security checks fail, release is blocked.

## 2) Environment and secrets

- Confirm `apps/mobile/.env` exists and uses production-safe values.
- Verify API base URL points to production backend.
- Confirm no secrets are committed to git.

## 3) Expo build setup

- Verify Expo account access and project ownership.
- Confirm app identifiers and versioning are correct in `apps/mobile/app.json`.
- Verify iOS/Android signing credentials are valid.

## 4) Build commands

From `apps/mobile`:

```bash
npm run start
npm run ios
npm run android
```

For store-ready builds, use your EAS build command:

```bash
# Example
# eas build --platform ios --profile production
# eas build --platform android --profile production
```

## 5) Release verification

- Login/register flow works.
- Dashboard and admin route access behave correctly.
- Idle timeout and session revocation flows are verified.
- App startup and navigation are stable on target devices.

## 6) Submission readiness

- App metadata/screenshots/privacy links are up to date.
- Release notes prepared from template:
  - `npm run release:notes`
- Rollback/contact plan documented.
