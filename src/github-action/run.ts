import * as core from "@actions/core";
import path from "node:path";
import { evaluateEvent } from "../core/engine.js";
import { loadRules } from "../core/rules.js";
import { readTextFile } from "../core/files.js";
import { type AgentEvent } from "../core/types.js";

async function run(): Promise<void> {
  try {
    const rulesPath = path.resolve(core.getInput("rules", { required: true }));
    const inputPath = path.resolve(core.getInput("input", { required: true }));
    const failOnWarn = core.getBooleanInput("fail_on_warn");

    const rules = await loadRules(rulesPath);
    const input = JSON.parse(await readTextFile(inputPath)) as AgentEvent;
    const result = evaluateEvent(input, rules);

    core.setOutput("decision", result.decision);
    core.setOutput("summary", result.summary);
    core.setOutput(
      "matched-rule-ids",
      result.triggered.map((entry) => entry.rule.id).join(",")
    );
    core.setOutput("result-json", JSON.stringify(result));

    if (result.decision === "block") {
      core.setFailed(result.summary);
      return;
    }

    if (result.decision === "warn" && failOnWarn) {
      core.setFailed(`Warnings treated as failures: ${result.summary}`);
      return;
    }

    core.info(`agent-guard decision: ${result.decision}`);
    core.info(result.summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
  }
}

void run();
