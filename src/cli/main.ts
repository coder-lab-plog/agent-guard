#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateEvent } from "../core/engine.js";
import { formatEvaluationPretty } from "../core/format.js";
import { ensureDirectory, pathExists, readTextFile } from "../core/files.js";
import { loadRules } from "../core/rules.js";
import { type AgentEvent } from "../core/types.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "eval":
        await runEval(args.slice(1));
        break;
      case "validate":
        await runValidate(args.slice(1));
        break;
      case "init":
        await runInit(args.slice(1));
        break;
      case "help":
      case "--help":
      case "-h":
      case undefined:
        printHelp();
        break;
      default:
        throw new Error(`Unknown command "${command}". Run "agent-guard help".`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`agent-guard: ${message}`);
    process.exit(1);
  }
}

async function runEval(args: string[]): Promise<void> {
  const options = parseFlags(args);
  const rulesPath = requiredOption(options, "rules");
  const inputPath = requiredOption(options, "input");
  const format = options.format === "json" ? "json" : "pretty";
  const failOnWarn = options["fail-on-warn"] === "true";

  const rules = await loadRules(rulesPath);
  if (rules.length === 0) {
    throw new Error(`No rules found under ${rulesPath}`);
  }

  const input = JSON.parse(await readTextFile(inputPath)) as AgentEvent;
  const result = evaluateEvent(input, rules);

  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatEvaluationPretty(result));
  }

  if (result.decision === "block") {
    process.exit(2);
  }

  if (result.decision === "warn" && failOnWarn) {
    process.exit(2);
  }
}

async function runValidate(args: string[]): Promise<void> {
  const options = parseFlags(args);
  const rulesPath = requiredOption(options, "rules");
  const rules = await loadRules(rulesPath);

  console.log(
    JSON.stringify(
      {
        ok: true,
        loadedRules: rules.length,
        ruleIds: rules.map((rule) => rule.id)
      },
      null,
      2
    )
  );
}

async function runInit(args: string[]): Promise<void> {
  const options = parseFlags(args);
  const preset = options.preset ?? "baseline";
  const targetDir = path.resolve(options.dir ?? ".agent-guard");
  const presetFile = path.resolve(projectRoot(), "presets", `${preset}.yml`);

  if (!(await pathExists(presetFile))) {
    throw new Error(`Unknown preset "${preset}"`);
  }

  await ensureDirectory(targetDir);
  const outputFile = path.join(targetDir, `${preset}.yml`);

  if (await pathExists(outputFile)) {
    throw new Error(`Refusing to overwrite existing file: ${outputFile}`);
  }

  await fs.copyFile(presetFile, outputFile);

  console.log(
    JSON.stringify(
      {
        ok: true,
        preset,
        outputFile
      },
      null,
      2
    )
  );
}

function parseFlags(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument "${arg}"`);
    }

    const key = arg.slice(2);
    const next = args[index + 1];

    if (!next || next.startsWith("--")) {
      result[key] = "true";
      continue;
    }

    result[key] = next;
    index += 1;
  }

  return result;
}

function requiredOption(options: Record<string, string>, key: string): string {
  const value = options[key];
  if (!value) {
    throw new Error(`Missing required option "--${key}"`);
  }
  return value;
}

function projectRoot(): string {
  const entryPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(entryPath), "../../..");
}

function printHelp(): void {
  console.log(`agent-guard

Programmable guardrails for coding agents.

Commands:
  agent-guard eval --rules <path> --input <event.json> [--format pretty|json] [--fail-on-warn]
  agent-guard validate --rules <path>
  agent-guard init --preset baseline --dir .agent-guard

Examples:
  agent-guard validate --rules presets/baseline.yml
  agent-guard eval --rules presets/baseline.yml --input examples/dangerous-command.json
  agent-guard init --preset baseline --dir .agent-guard
`);
}

void main();
