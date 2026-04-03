#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const demoDir = path.join(root, "demo");
const eventsDir = path.join(demoDir, "generated", "events");
const resultsDir = path.join(demoDir, "generated", "results");
const cli = path.join(root, "dist", "src", "cli", "main.js");
const rules = path.join(root, "presets", "baseline.yml");

const scenarios = [
  {
    name: "claude-code-dangerous",
    normalize: [
      "node",
      path.join(root, "adapters", "claude-code", "normalize-event.mjs"),
      path.join(root, "examples", "adapters", "claude-code-hook.json"),
      path.join(eventsDir, "claude-code-dangerous.json")
    ]
  },
  {
    name: "codex-dangerous",
    normalize: [
      "node",
      path.join(root, "adapters", "codex", "normalize-event.mjs"),
      path.join(root, "examples", "adapters", "codex-wrapper-event.json"),
      path.join(eventsDir, "codex-dangerous.json")
    ]
  },
  {
    name: "safe-allow",
    copyFrom: path.join(root, "test", "fixtures", "allow-event.json"),
    eventPath: path.join(eventsDir, "safe-allow.json")
  }
];

await rm(path.join(demoDir, "generated"), { recursive: true, force: true });
await mkdir(eventsDir, { recursive: true });
await mkdir(resultsDir, { recursive: true });

for (const scenario of scenarios) {
  const eventPath =
    scenario.eventPath ?? path.join(eventsDir, `${scenario.name}.json`);

  if (scenario.normalize) {
    await execFileAsync(scenario.normalize[0], scenario.normalize.slice(1), { cwd: root });
  } else if (scenario.copyFrom) {
    const payload = await readFile(scenario.copyFrom, "utf8");
    await writeFile(eventPath, payload, "utf8");
  }

  let status = 0;
  let stdout = "";

  try {
    const result = await execFileAsync(
      "node",
      [cli, "eval", "--rules", rules, "--input", eventPath, "--format", "json"],
      { cwd: root }
    );
    stdout = result.stdout;
  } catch (error) {
    status = error.code ?? 1;
    stdout = error.stdout ?? "";
  }

  await writeFile(
    path.join(resultsDir, `${scenario.name}.json`),
    JSON.stringify(
      {
        name: scenario.name,
        exitCode: status,
        result: stdout ? JSON.parse(stdout) : null
      },
      null,
      2
    ),
    "utf8"
  );
}

console.log(`Prepared demo artifacts in ${path.join(demoDir, "generated")}`);
