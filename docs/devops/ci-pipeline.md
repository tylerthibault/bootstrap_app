# CI Pipeline

The repository uses a single CI workflow at `.github/workflows/quality-gates.yml`.

## Trigger conditions

- Pull requests
- Pushes to `main`

## Pipeline stages

1. Checkout repository
2. Setup Node.js 20
3. Setup Python 3.12
4. Install npm dependencies (`npm install`)
5. Install backend Python dependencies (`pip install -r apps/backend/requirements.txt`)
6. Run lint quality gates (`npm run lint`)
7. Run test suites (`npm run test`)
8. Run build check for SEO app (`npm run --workspace @smn/web-seo build`)

## Quality gate behavior

- Any non-zero step fails the pipeline.
- Merge should be blocked when lint/test/build fails.

## Local parity commands

Run the same checks locally:

```bash
npm run lint
npm run test
npm run --workspace @smn/web-seo build
```
