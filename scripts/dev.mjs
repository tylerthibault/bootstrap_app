import { spawn } from "node:child_process";

const services = [
  {
    name: "backend",
    command: "python3",
    args: ["apps/backend/run.py"],
    color: "\x1b[36m",
  },
  {
    name: "web-seo",
    command: "npm",
    args: ["run", "--workspace", "@smn/web-seo", "dev"],
    color: "\x1b[35m",
  },
  {
    name: "mobile",
    command: "npm",
    args: ["run", "--workspace", "@smn/mobile", "start"],
    color: "\x1b[33m",
  },
];

const reset = "\x1b[0m";
const children = [];

function pipeOutput(child, service) {
  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`${service.color}[${service.name}]${reset} ${chunk}`);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`${service.color}[${service.name}]${reset} ${chunk}`);
  });
}

for (const service of services) {
  const child = spawn(service.command, service.args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  pipeOutput(child, service);
  children.push(child);

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${service.name} exited with code ${code}.`);
      for (const processChild of children) {
        if (!processChild.killed) {
          processChild.kill("SIGTERM");
        }
      }
      process.exit(code);
    }
  });
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
