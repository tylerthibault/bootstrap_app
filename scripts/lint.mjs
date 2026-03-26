import { spawnSync } from "node:child_process";

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if ((result.status ?? 1) !== 0) {
    console.error(`\n${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

run("python3", ["-m", "compileall", "apps/backend/app"], "Python syntax check");
run(
  "npm",
  [
    "exec",
    "--",
    "prettier",
    "--check",
    "scripts/**/*.mjs",
    "apps/mobile/tests/**/*.mjs",
    "docs/testing/**/*.md",
    ".github/workflows/**/*.yml",
  ],
  "Formatting check",
);

console.log("Lint quality gates passed.");
process.exit(0);
