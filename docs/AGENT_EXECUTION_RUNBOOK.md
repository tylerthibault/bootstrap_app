# Agent Execution Runbook

Use this file as a step-by-step queue. Each step includes:
- Goal: the expected outcome
- Agent Prompt: copy/paste directly into your coding agent
- Done Criteria: how to verify completion
- Required Docs: markdown files to add/update in `docs/<category>/<name>.md`

## Step 1: Initialize monorepo and baseline tooling (done)
Goal: Create a clean monorepo for mobile/web/backend/docs with consistent tooling.

Agent Prompt:
"Create a monorepo for a bootstrap app platform with these top-level folders: `apps/mobile`, `apps/web-seo`, `apps/backend`, `packages/shared`, `packages/config`, `docs`, and `.github`. Use TypeScript where applicable. Add root scripts for install, lint, test, and dev. Add `.editorconfig`, `.gitignore`, and a root `README.md`. Keep defaults minimal and production-safe."

Done Criteria:
- Folder structure exists and installs successfully.
- Root scripts run without missing-command errors.
- Verification note: Folder structure and scripts were created. Script execution could not be validated in this shell because `node` and `npm` are not installed.

Required Docs:
- `docs/setup/repository-structure.md`
- `docs/setup/local-development.md`

## Step 2: Bootstrap Expo app for Android, iOS, and web app-shell (done)
Goal: Create the cross-platform app project and verify local startup.

Agent Prompt:
"Inside `apps/mobile`, initialize an Expo TypeScript app configured for Android, iOS, and web. Add scripts for `start`, `android`, `ios`, and `web`. Add a simple navigation shell with placeholder screens for Login, Register, Dashboard, and Admin Dashboard. Ensure app runs on web and Expo dev server starts without errors."

Done Criteria:
- Expo starts and placeholder screens render.
- Android/iOS targets are configured.
- Verification note: Expo scaffold, scripts, and placeholder screens were created. Runtime startup could not be executed in this shell because `npm` is not installed.

Required Docs:
- `docs/mobile/expo-setup.md`
- `docs/mobile/navigation-shell.md`

## Step 3: Bootstrap SEO website (done)
Goal: Add a dedicated SEO site for public pages.

Agent Prompt:
"Inside `apps/web-seo`, scaffold a Next.js app for public SEO pages. Create routes for `/`, `/features`, `/docs`, `/privacy`, and `/terms`. Add metadata, sitemap setup, and robots setup. Keep branding generic and starter-ready."

Done Criteria:
- SEO site runs locally and routes are reachable.
- Metadata/sitemap scaffolding is present.
- Verification note: Next.js scaffold, routes, metadata, robots, and sitemap were created. Runtime startup could not be executed in this shell because `npm` is not installed.

Required Docs:
- `docs/web-seo/getting-started.md`
- `docs/web-seo/metadata-and-sitemap.md`

## Step 4: Bootstrap Flask backend API (done)
Goal: Create Flask API with modular structure and migrations.

Agent Prompt:
"Inside `apps/backend`, scaffold a Flask API using an app factory pattern and modules: `auth`, `users`, `roles`, `sessions`, `logs`, `admin`, `health`. Add environment-based config, CORS, and migration support. Add a health endpoint and readiness endpoint."

Done Criteria:
- Backend starts locally with health endpoints returning success.
- Migration tooling is configured.
- Verification note: Flask app-factory scaffold, modules, CORS config, migration wiring, and health/readiness endpoints were created. Runtime execution was not validated in this shell because Python tooling is unavailable.

Required Docs:
- `docs/backend/flask-architecture.md`
- `docs/backend/environment-configuration.md`

## Step 5: Create baseline database schema (done)
Goal: Add initial tables required for bootstrap functionality.

Agent Prompt:
"Create initial database migrations for: `users`, `roles`, `user_roles`, `oauth_accounts`, `sessions`, `activity_logs`, and `audit_logs`. Include indexes for common lookup paths (email, role mappings, session tokens, log timestamps). Add seed data for `user` and `admin` roles."

Done Criteria:
- Migrations apply successfully on a fresh database.
- Role seed data is inserted.
- Verification note: Applied migrations on a fresh SQLite database and confirmed seeded roles: `admin`, `user`.

Required Docs:
- `docs/database/schema-overview.md`
- `docs/database/migrations-and-seeds.md`

## Step 6: Implement auth (register/login/logout/refresh)
Goal: Build core authentication flows with secure session handling.

Agent Prompt:
"Implement auth endpoints: register, login, refresh token, logout, logout all sessions, password reset request, password reset confirm, and email verification. Use secure password hashing and refresh token rotation. Return consistent API response envelopes and error formats."

Done Criteria:
- Endpoints return expected status codes and payloads.
- Refresh rotation and logout-all work as expected.

Required Docs:
- `docs/auth/api-endpoints.md`
- `docs/auth/token-lifecycle.md`

## Step 7: Implement OAuth (Google + Apple)
Goal: Add social login that links to local users.

Agent Prompt:
"Implement OAuth login with Google and Apple, including callback handling, account linking, and conflict handling when provider email already exists. Persist provider identity in `oauth_accounts`. Add configuration placeholders for client IDs/secrets."

Done Criteria:
- OAuth flow works in local/dev environment with test credentials.
- Linked accounts map to one local user.

Required Docs:
- `docs/auth/oauth-google.md`
- `docs/auth/oauth-apple.md`

## Step 8: Implement RBAC and protected routes
Goal: Enforce roles and permissions across API and UI.

Agent Prompt:
"Implement RBAC middleware/decorators in backend and route guards in frontend. Define baseline permissions for `user` and `admin`. Protect all admin endpoints and admin UI routes. Return clear forbidden responses and log denied access attempts."

Done Criteria:
- Non-admin users cannot access admin APIs/pages.
- Forbidden attempts are logged.

Required Docs:
- `docs/security/rbac-model.md`
- `docs/security/route-protection.md`

## Step 9: Build user dashboard
Goal: Add authenticated dashboard for standard users.

Agent Prompt:
"Build a user dashboard screen that shows profile basics, recent activity list, active sessions, and account actions (logout current session, logout all sessions). Use API-backed data and loading/error states."

Done Criteria:
- Dashboard loads for authenticated users.
- Session controls work end-to-end.

Required Docs:
- `docs/features/user-dashboard.md`

## Step 10: Build admin dashboard
Goal: Add management interface for admins.

Agent Prompt:
"Build an admin dashboard with user search/filter, role assignment, account status controls, session revocation, and audit log browser. Add pagination and safe confirmation for destructive actions."

Done Criteria:
- Admin users can manage users/roles/sessions.
- All admin changes write audit records.

Required Docs:
- `docs/features/admin-dashboard.md`
- `docs/features/user-management.md`

## Step 11: Implement activity logging and idle auto-logout
Goal: Track interactions and enforce inactivity policies.

Agent Prompt:
"Implement client activity heartbeat and backend idle timeout enforcement using `activity_logs` and `sessions`. Add configurable values for warning timeout and hard timeout. Trigger auto-logout after inactivity and invalidate relevant session tokens."

Done Criteria:
- Activity records are created for key actions.
- Idle users are logged out according to policy.

Required Docs:
- `docs/security/idle-timeout-policy.md`
- `docs/observability/activity-logging.md`

## Step 12: Add test suites and quality gates
Goal: Ensure the starter is stable and reusable.

Agent Prompt:
"Add tests for backend auth/session/RBAC flows and frontend critical auth/dashboard flows. Add linting, formatting, and CI checks that must pass before merge. Include integration tests for refresh token rotation and idle timeout behavior."

Done Criteria:
- `lint` and `test` pass in CI.
- Critical auth/security paths are covered by tests.

Required Docs:
- `docs/testing/test-strategy.md`
- `docs/testing/run-tests.md`

## Step 13: Add CI/CD and environment templates
Goal: Make the starter easy to run and ship.

Agent Prompt:
"Set up CI for install/lint/test/build and create environment templates for mobile, SEO web, and backend. Add scripts for local bootstrap and one-command dev startup. Document secret management and non-committed env files."

Done Criteria:
- CI runs on pull requests.
- Fresh clone can boot locally with documented steps.

Required Docs:
- `docs/devops/ci-pipeline.md`
- `docs/devops/environment-variables.md`

## Step 14: Add release-readiness checks
Goal: Confirm app can be shipped to stores and web hosting.

Agent Prompt:
"Add release checklists for Expo builds (Android/iOS), web deployment, and backend deployment. Include pre-release validation scripts and a release notes template. Ensure failures block release if tests or security checks fail."

Done Criteria:
- Release checklist is executable and realistic.
- Build/deploy commands are documented and tested.

Required Docs:
- `docs/release/mobile-release-checklist.md`
- `docs/release/web-backend-release-checklist.md`

## Step 15: Final documentation pass and starter template polish
Goal: Make this a reusable bootstrap product.

Agent Prompt:
"Perform a final documentation pass across all `docs/*`. Add a docs index page linking all guides, add troubleshooting and FAQ pages, and ensure every major module has setup, usage, and maintenance instructions. Update root README with quick-start and architecture overview."

Done Criteria:
- Docs are navigable and complete.
- New developer can onboard from docs only.

Required Docs:
- `docs/index.md`
- `docs/troubleshooting/common-issues.md`
- `docs/faq/bootstrap-faq.md`

## Recommended execution order
1. Complete steps 1-5 before feature work.
2. Complete steps 6-11 before broad UI polish.
3. Complete steps 12-15 before first public release.

## Definition of complete bootstrap v1
- Cross-platform app starts and authenticates users.
- OAuth and RBAC are functional.
- User and admin dashboards are operational.
- Activity logging and idle timeout are enforced.
- Tests pass in CI.
- Docs exist for setup, usage, security, testing, and release.
