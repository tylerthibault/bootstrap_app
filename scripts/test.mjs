import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const mode = process.argv[2];

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if ((result.status ?? 1) !== 0) {
    console.error(`\n${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

if (mode === "auth-smoke") {
  const python = process.env.PYTHON || "python3";
  const scriptPath = resolve(
    process.cwd(),
    "apps/backend/scripts/smoke_auth.py",
  );
  run(python, [scriptPath], "Auth smoke test");
  process.exit(0);
}

run(
  "python3",
  ["-m", "unittest", "discover", "-s", "apps/backend/tests", "-p", "test_*.py"],
  "Backend integration tests",
);
run(
  "node",
  ["--test", "apps/mobile/tests/auth-dashboard-flows.test.mjs"],
  "Frontend flow tests",
);

console.log("All test suites passed.");
process.exit(0);
