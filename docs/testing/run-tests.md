# Run Tests

## Prerequisites

- Node.js 20+
- npm
- Python 3.11+
- pip

## Install dependencies

From repository root:

```bash
cd /Users/tyler.t/Documents/Coding/Apps/bootstrap_app
npm install
pip install -r apps/backend/requirements.txt
```

## Lint and formatting checks

```bash
npm run lint
```

Checks include:

- Backend Python syntax compilation
- Formatting checks via Prettier (`--check`)

## Run all tests

```bash
npm run test
```

Runs:

- Backend integration tests (`apps/backend/tests/test_auth_session_rbac.py`)
- Frontend auth/dashboard flow tests (`apps/mobile/tests/auth-dashboard-flows.test.mjs`)

## Run auth smoke test only

```bash
npm run test -- auth-smoke
```

## CI

CI quality gates are defined in:

- `.github/workflows/quality-gates.yml`

CI executes:

- dependency installation
- `npm run lint`
- `npm run test`
