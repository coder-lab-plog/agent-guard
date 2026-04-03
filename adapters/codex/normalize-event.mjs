#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeJson } from "../shared/write-json.mjs";

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? ".agent-guard/events/codex-event.json";

  if (!inputPath) {
    throw new Error("Usage: node adapters/codex/normalize-event.mjs <input.json> [output.json]");
  }

  const payload = JSON.parse(await readFile(path.resolve(inputPath), "utf8"));
  const event = normalizeCodexWrapperEvent(payload);
  const written = await writeJson(outputPath, event);
  process.stdout.write(`${written}\n`);
}

export function normalizeCodexWrapperEvent(payload) {
  const type = String(payload.type ?? payload.kind ?? "");
  const tool = payload.tool ?? {};

  let kind = "session";
  if (type === "tool_call" || type === "bash") {
    kind = "tool_call";
  } else if (type === "file_write" || type === "edit") {
    kind = "file_write";
  } else if (type === "prompt") {
    kind = "prompt";
  } else if (type === "mcp_call") {
    kind = "mcp_call";
  }

  return {
    kind,
    source: "codex",
    agent: payload.agent ?? "default",
    toolName: tool.name ?? payload.tool_name ?? undefined,
    command: tool.command ?? payload.command ?? undefined,
    filePath: tool.filePath ?? payload.file_path ?? undefined,
    content: tool.content ?? payload.content ?? undefined,
    prompt: payload.prompt ?? undefined,
    mcpServer: payload.mcp_server ?? undefined,
    mcpTool: payload.mcp_tool ?? undefined,
    tags: Array.isArray(payload.tags) ? payload.tags : undefined,
    metadata: {
      rawType: type,
      tool
    }
  };
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
