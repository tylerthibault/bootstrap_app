import { existsSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();

const envTemplates = [
  {
    source: resolve(root, "apps/backend/.env.example"),
    target: resolve(root, "apps/backend/.env"),
  },
  {
    source: resolve(root, "apps/mobile/.env.example"),
    target: resolve(root, "apps/mobile/.env"),
  },
  {
    source: resolve(root, "apps/web-seo/.env.example"),
    target: resolve(root, "apps/web-seo/.env.local"),
  },
];

for (const envFile of envTemplates) {
  if (existsSync(envFile.source) && !existsSync(envFile.target)) {
    copyFileSync(envFile.source, envFile.target);
    console.log(`Created ${envFile.target} from template.`);
  }
}

const pipInstall = spawnSync(
  "python3",
  ["-m", "pip", "install", "-r", "apps/backend/requirements.txt"],
  {
    stdio: "inherit",
  },
);

if ((pipInstall.status ?? 1) !== 0) {
  console.error("Failed to install backend Python dependencies.");
  process.exit(pipInstall.status ?? 1);
}

console.log("Bootstrap complete.");
