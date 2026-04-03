import { type EvaluationResult, type TriggeredRule } from "./types.js";

export function formatEvaluationPretty(result: EvaluationResult): string {
  const lines = [
    `Decision: ${result.decision.toUpperCase()}`,
    `Summary: ${result.summary}`,
    `Rules loaded: ${result.stats.loadedRules}`,
    `Rules matched: ${result.stats.matchedRules}`
  ];

  if (result.triggered.length === 0) {
    return lines.join("\n");
  }

  lines.push("", "Triggered rules:");

  for (const triggered of result.triggered) {
    lines.push(...formatTriggeredRule(triggered));
  }

  return lines.join("\n");
}

function formatTriggeredRule(triggered: TriggeredRule): string[] {
  const lines = [
    `- ${triggered.rule.id} [${triggered.rule.action}]`,
    `  ${triggered.rule.message}`
  ];

  if (triggered.reasons.length > 0) {
    lines.push(`  Reasons: ${triggered.reasons.join("; ")}`);
  }

  return lines;
}
