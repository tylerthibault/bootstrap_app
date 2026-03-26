import { execSync, spawn } from "node:child_process";

const port = process.env.PORT ?? "3199";

function getListeningPids(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!output) {
      return [];
    }

    return output
      .split("\n")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value));
  } catch {
    return [];
  }
}

function terminatePid(pid) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }

  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // Ignore if process already exited.
  }
}

const pids = getListeningPids(port);
if (pids.length > 0) {
  console.log(`Port ${port} is in use. Terminating listener(s): ${pids.join(", ")}`);
  for (const pid of pids) {
    terminatePid(pid);
  }
}

const child = spawn("next", ["dev", "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
