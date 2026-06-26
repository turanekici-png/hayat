import { spawn, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const npxCommand = isWindows ? "npx.cmd" : "npx";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const port = process.env.PORT || "3000";

function runStep(label, command, args) {
  console.log(`\n[baslatma] ${label}...`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    console.error(`[baslatma] ${label} basarisiz oldu.`);
    process.exit(result.status || 1);
  }
}

runStep("Veritabani migration", npxCommand, ["prisma", "migrate", "deploy"]);
runStep("Admin kullanici kontrolu", npmCommand, ["run", "admin:ensure"]);
runStep("Eski medya kayitlarini DB'ye aktarma", npmCommand, ["run", "media:backfill-db"]);

console.log("\n[baslatma] Web sitesi baslatiliyor...");
const next = spawn(npxCommand, ["next", "start", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  shell: false
});

next.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code || 0);
});
