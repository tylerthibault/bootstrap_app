import { spawnSync } from "node:child_process";

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if ((result.status ?? 1) !== 0) {
    console.error(`\n${label} failed. Release is blocked.`);
    process.exit(result.status ?? 1);
  }
}

run("npm", ["run", "lint"], "Lint gate");
run("npm", ["run", "test"], "Test gate");
run("npm", ["run", "--workspace", "@smn/web-seo", "build"], "Web build gate");

run("node", ["./scripts/security-check.mjs"], "Security gate");

console.log("Release validation passed.");
