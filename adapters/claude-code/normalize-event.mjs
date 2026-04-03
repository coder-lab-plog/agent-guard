#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeJson } from "../shared/write-json.mjs";

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? ".agent-guard/events/claude-code-event.json";

  if (!inputPath) {
    throw new Error("Usage: node adapters/claude-code/normalize-event.mjs <input.json> [output.json]");
  }

  const payload = JSON.parse(await readFile(path.resolve(inputPath), "utf8"));
  const event = normalizeClaudeCodeHook(payload);
  const written = await writeJson(outputPath, event);
  process.stdout.write(`${written}\n`);
}

export function normalizeClaudeCodeHook(payload) {
  const hookEvent = String(payload.hook_event_name ?? "");
  const toolName = String(payload.tool_name ?? "");
  const toolInput = payload.tool_input ?? {};

  let kind = "session";
  if (hookEvent === "PreToolUse" || hookEvent === "PostToolUse") {
    kind = toolName === "Bash" ? "tool_call" : "file_write";
  } else if (hookEvent === "UserPromptSubmit") {
    kind = "prompt";
  } else if (hookEvent === "Stop") {
    kind = "stop";
  }

  return {
    kind,
    source: "claude-code",
    agent: payload.agent_name ?? "default",
    toolName: toolName ? toolName.toLowerCase() : undefined,
    command: toolInput.command ?? undefined,
    filePath: toolInput.file_path ?? toolInput.path ?? undefined,
    content: toolInput.content ?? toolInput.new_string ?? toolInput.new_text ?? undefined,
    prompt: payload.user_prompt ?? undefined,
    transcript: payload.transcript_path ?? undefined,
    metadata: {
      hookEventName: hookEvent,
      toolInput
    }
  };
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
