## Plan: Bootstrap App Platform (Expo + Flask + SEO Web)

Build a reusable starter platform that you can clone for future products. It ships with users, roles, login/registration, OAuth providers, user dashboard, admin dashboard, audit/activity logging, and session inactivity auto-logout. This becomes your baseline for Android, iOS, and web launches.

**Core bootstrap modules (first-class requirements)**
1. Authentication: email/password registration, login, password reset, email verification.
1. OAuth: Google and Apple login (Apple mandatory on iOS when social login is present).
1. Authorization: RBAC with roles such as `user`, `admin`, and optional `owner`.
1. Session security: access/refresh tokens, token rotation, device/session list, revoke-all-sessions.
1. Activity log table: records meaningful user interactions and session heartbeats.
1. Idle timeout: auto-logout when no interaction for X minutes (configurable by env and role).
1. User dashboard: profile summary, recent activity, account/session controls.
1. Admin dashboard: user management, role assignment, audit explorer, feature flags.
1. Observability: app/backend errors, auth failures, and security event alerts.

**Suggested database baseline**
1. `users`: identity, status, verification fields, profile metadata.
1. `roles`: role names and permissions versioning.
1. `user_roles`: many-to-many map between users and roles.
1. `oauth_accounts`: provider identity links (`provider`, `provider_user_id`, `user_id`).
1. `sessions`: refresh token family, device info, IP, expiry, revoked timestamp.
1. `activity_logs`: user actions, route/screen, metadata json, created timestamp.
1. `audit_logs`: privileged/admin actions with before/after change records.
1. `feature_flags` (optional but useful): controlled feature rollout.

**Steps**
1. Phase 1 - Bootstrap architecture and contracts (week 1)
1. Lock stack: Expo managed + Flask API + PostgreSQL + Redis (session/heartbeat cache).
1. Define auth and RBAC contracts first: register, login, refresh, logout, OAuth callback, assign role, revoke session.
1. Define session/idle policy: heartbeat interval, idle timeout X, max absolute session age, remember-me behavior.
1. Define event taxonomy for `activity_logs` and `audit_logs` to keep analytics and security useful.
1. Phase 2 - Foundation setup (weeks 2-3) (*depends on phase 1*)
1. Initialize monorepo with three apps: mobile+app-web (Expo), seo-web (Next.js), backend (Flask).
1. Add shared API types and validation schemas for auth/session/admin endpoints.
1. Set up Flask modules: auth, users, roles, sessions, logs, admin.
1. Implement migration system and seed scripts (default roles, admin bootstrap account).
1. Configure observability baseline: structured logs, Sentry, auth/security metric counters.
1. Phase 3 - Auth + RBAC + OAuth implementation (weeks 4-7) (*depends on phase 2*)
1. Implement registration/login/reset/verify flows and secure token storage on web/mobile.
1. Implement OAuth with Google and Apple, account linking, and conflict handling.
1. Implement RBAC middleware and policy checks for all protected routes.
1. Implement sessions table + refresh rotation + revoke-on-compromise behavior.
1. Phase 4 - Dashboards + activity logging (weeks 7-10) (*depends on phase 3*)
1. Build user dashboard (profile, recent activity, active sessions, logout other devices).
1. Build admin dashboard (user CRUD, role assignment, session revocation, audit filtering).
1. Add frontend interaction logging to `activity_logs` with privacy-safe payload rules.
1. Add admin and sensitive change tracking to `audit_logs` with immutable write patterns.
1. Phase 5 - Idle timeout and security hardening (weeks 10-12) (*depends on phase 4*)
1. Implement client heartbeat + backend idle expiry checks.
1. Enforce auto-logout after X inactivity minutes and graceful token invalidation.
1. Add brute-force controls: rate limits, lockouts, suspicious login alerts.
1. Add CSRF/session fixation protections for web auth flows.
1. Phase 6 - Release readiness and template packaging (weeks 12-14) (*depends on phase 5*)
1. Configure EAS build/submission pipelines and internal test tracks.
1. Add bootstrap docs: env vars, migration commands, seed/admin setup, OAuth provider setup.
1. Create a starter checklist so future apps can be launched by cloning this base.
1. Publish v1 of the bootstrap template and tag a stable release.

**Default inactivity policy (starter values)**
1. Heartbeat every 60-120 seconds while app is active.
1. Soft timeout warning at 10 minutes idle.
1. Hard logout at 15 minutes idle (configurable by environment).
1. Absolute session maximum 7 days with refresh rotation.
1. Admin sessions stricter than standard users (example: 10-minute hard timeout).

**Additional basic functionality worth including now**
1. Profile editing and avatar upload.
1. Email templates and transactional email queue (verify/reset/security alerts).
1. Notification center (in-app to start; push/email later).
1. Basic settings page (theme, language, privacy toggles).
1. Feature flag gate for unfinished modules.
1. Health endpoint and status page metadata.
1. API docs endpoint and Postman/Insomnia collection export.

**Relevant files**
- No repository files exist yet. Create a monorepo structure and map these modules into concrete packages.

**Verification**
1. Auth flow validation: register/login/reset/verify and OAuth pass on iOS, Android, and web.
1. RBAC validation: forbidden actions are blocked and audited for all non-admin users.
1. Session validation: refresh rotation, revoke-all, and forced logout scenarios pass integration tests.
1. Idle timeout validation: inactivity auto-logout triggers correctly at configured thresholds.
1. Logging validation: `activity_logs` and `audit_logs` capture expected events without sensitive raw secrets.
1. Admin validation: role assignment and user/session management actions are fully traceable.
1. Release validation: TestFlight/Play internal builds stable with no critical auth/session regressions.

**Decisions**
- Included: auth-first bootstrap architecture, RBAC, OAuth, dual dashboards, activity/audit logs, idle auto-logout.
- Excluded for v1: advanced multi-tenant org model, granular ABAC policies, and heavy BI reporting.
- Assumption: this starter will be reused, so modularity and security defaults are prioritized over rapid one-off feature work.

**Further Considerations**
1. OAuth provider expansion: add GitHub/Microsoft later if B2B demand appears.
2. Security posture upgrade path: add MFA (TOTP/WebAuthn) in v2.
3. Multi-tenant path: add organizations, org roles, and org-scoped audit logs if needed.
4. Compliance path: add data retention policies and export/delete tooling for privacy requirements.