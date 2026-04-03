import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readTextFile } from "../src/core/files.js";
import { evaluateEvent } from "../src/core/engine.js";
import { loadRules } from "../src/core/rules.js";
import { type AgentEvent } from "../src/core/types.js";

const projectRoot = process.cwd();

test("evaluateEvent allows safe commands", async () => {
  const rules = await loadRules(path.join(projectRoot, "presets/baseline.yml"));
  const event = JSON.parse(
    await readTextFile(path.join(projectRoot, "test/fixtures/allow-event.json"))
  ) as AgentEvent;

  const result = evaluateEvent(event, rules);
  assert.equal(result.decision, "allow");
  assert.equal(result.triggered.length, 0);
});

test("evaluateEvent blocks dangerous bash commands", async () => {
  const rules = await loadRules(path.join(projectRoot, "presets/baseline.yml"));
  const event = JSON.parse(
    await readTextFile(path.join(projectRoot, "test/fixtures/block-event.json"))
  ) as AgentEvent;

  const result = evaluateEvent(event, rules);
  assert.equal(result.decision, "block");
  assert.equal(result.triggered[0]?.rule.id, "block-dangerous-shell");
});

test("evaluateEvent warns on sensitive file changes", async () => {
  const rules = await loadRules(path.join(projectRoot, "presets/baseline.yml"));
  const event = JSON.parse(
    await readTextFile(path.join(projectRoot, "test/fixtures/warn-event.json"))
  ) as AgentEvent;

  const result = evaluateEvent(event, rules);
  assert.equal(result.decision, "warn");
  assert.ok(result.triggered.some((entry) => entry.rule.id === "warn-sensitive-files"));
});

test("loadRules accepts a dedicated rule directory", async () => {
  const rules = await loadRules(path.join(projectRoot, "test/rules"));
  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id, "warn-debug-print");
});
