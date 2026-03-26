import { execSync } from "node:child_process";

function listTrackedFiles() {
  const output = execSync("git ls-files", { encoding: "utf-8" });
  return output
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readFile(path) {
  return execSync(`cat "${path}"`, { encoding: "utf-8" });
}

function fail(message) {
  console.error(`Security check failed: ${message}`);
  process.exit(1);
}

const trackedFiles = listTrackedFiles();

const forbiddenEnvFiles = trackedFiles.filter(
  (file) =>
    (file.endsWith("/.env") ||
      file.endsWith("/.env.local") ||
      file === ".env" ||
      file.startsWith(".env.")) &&
    !file.endsWith(".env.example"),
);

if (forbiddenEnvFiles.length > 0) {
  fail(`tracked environment files found: ${forbiddenEnvFiles.join(", ")}`);
}

const suspiciousPattern =
  /(SECRET_KEY\s*=\s*change-me|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,})/;

for (const file of trackedFiles) {
  if (
    file.includes("node_modules/") ||
    file.includes(".next/") ||
    file.endsWith(".env.example") ||
    file.startsWith("docs/")
  ) {
    continue;
  }

  let content = "";
  try {
    content = readFile(file);
  } catch {
    continue;
  }

  if (suspiciousPattern.test(content)) {
    fail(`suspicious secret pattern found in ${file}`);
  }
}

console.log("Security checks passed.");
