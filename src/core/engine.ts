import { type AgentEvent, type EvaluationResult, type GuardRule, type MatchCondition, type TriggeredRule } from "./types.js";

export function evaluateEvent(event: AgentEvent, rules: GuardRule[]): EvaluationResult {
  const triggered: TriggeredRule[] = [];

  for (const rule of rules) {
    if (!ruleAppliesToEvent(rule, event)) {
      continue;
    }

    const evaluation = matchRule(rule, event);
    if (evaluation.matched) {
      triggered.push({
        rule,
        reasons: evaluation.reasons
      });
    }
  }

  const hasBlock = triggered.some((entry) => entry.rule.action === "block");
  const hasWarn = triggered.some((entry) => entry.rule.action === "warn");
  const decision = hasBlock ? "block" : hasWarn ? "warn" : "allow";

  return {
    decision,
    summary: summarize(decision, triggered),
    triggered,
    stats: {
      loadedRules: rules.length,
      matchedRules: triggered.length
    }
  };
}

function ruleAppliesToEvent(rule: GuardRule, event: AgentEvent): boolean {
  if (!rule.appliesTo || rule.appliesTo.length === 0) {
    return true;
  }

  return rule.appliesTo.includes(event.kind);
}

function matchRule(rule: GuardRule, event: AgentEvent): { matched: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (rule.match.all) {
    for (const condition of rule.match.all) {
      const result = evaluateCondition(condition, event);
      if (!result.matched) {
        return { matched: false, reasons: [] };
      }
      reasons.push(result.reason);
    }
  }

  if (rule.match.any && rule.match.any.length > 0) {
    const anyResults = rule.match.any.map((condition) => evaluateCondition(condition, event));
    const matches = anyResults.filter((result) => result.matched);

    if (matches.length === 0) {
      return { matched: false, reasons: [] };
    }

    reasons.push(...matches.map((result) => result.reason));
  }

  return { matched: true, reasons };
}

function evaluateCondition(condition: MatchCondition, event: AgentEvent): { matched: boolean; reason: string } {
  const rawValue = getFieldValue(event, condition.field);

  if (condition.operator === "exists") {
    return {
      matched: rawValue !== undefined && rawValue !== null,
      reason: `${condition.field} exists`
    };
  }

  if (condition.operator === "not_exists") {
    return {
      matched: rawValue === undefined || rawValue === null,
      reason: `${condition.field} does not exist`
    };
  }

  if (rawValue === undefined || rawValue === null) {
    return {
      matched: false,
      reason: `${condition.field} is missing`
    };
  }

  const value = normalizeComparable(rawValue);
  const expected = condition.value;
  const matched = compareValues(value, expected, condition);

  return {
    matched,
    reason: `${condition.field} ${condition.operator} ${formatValue(expected)}`
  };
}

function compareValues(
  actual: string,
  expected: MatchCondition["value"],
  condition: MatchCondition
): boolean {
  const normalizedActual = normalizeString(actual, condition.ignoreCase);

  switch (condition.operator) {
    case "equals":
      return normalizedActual === normalizeString(String(expected ?? ""), condition.ignoreCase);
    case "not_equals":
      return normalizedActual !== normalizeString(String(expected ?? ""), condition.ignoreCase);
    case "contains":
      return normalizedActual.includes(normalizeString(String(expected ?? ""), condition.ignoreCase));
    case "not_contains":
      return !normalizedActual.includes(normalizeString(String(expected ?? ""), condition.ignoreCase));
    case "starts_with":
      return normalizedActual.startsWith(normalizeString(String(expected ?? ""), condition.ignoreCase));
    case "ends_with":
      return normalizedActual.endsWith(normalizeString(String(expected ?? ""), condition.ignoreCase));
    case "regex": {
      const pattern = typeof expected === "string" ? expected : String(expected ?? "");
      const flags = condition.ignoreCase ? "i" : "";
      return new RegExp(pattern, flags).test(actual);
    }
    case "in":
      return toList(expected).some(
        (entry) => normalizedActual === normalizeString(String(entry), condition.ignoreCase)
      );
    case "not_in":
      return toList(expected).every(
        (entry) => normalizedActual !== normalizeString(String(entry), condition.ignoreCase)
      );
    default:
      return false;
  }
}

function toList(value: MatchCondition["value"]): Array<string | number | boolean> {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined) {
    return [];
  }
  return [value];
}

function getFieldValue(input: unknown, fieldPath: string): unknown {
  return fieldPath.split(".").reduce<unknown>((current, segment) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      return Number.isInteger(index) ? current[index] : undefined;
    }

    if (typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, input);
}

function normalizeComparable(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(" ");
  }

  return String(value);
}

function normalizeString(value: string, ignoreCase = false): string {
  return ignoreCase ? value.toLowerCase() : value;
}

function formatValue(value: MatchCondition["value"]): string {
  if (Array.isArray(value)) {
    return `[${value.join(", ")}]`;
  }
  return String(value);
}

function summarize(decision: EvaluationResult["decision"], triggered: TriggeredRule[]): string {
  if (triggered.length === 0) {
    return "No guard rules matched this event.";
  }

  const ids = triggered.map((entry) => entry.rule.id).join(", ");
  if (decision === "block") {
    return `Blocked by ${triggered.length} rule(s): ${ids}`;
  }
  if (decision === "warn") {
    return `Warned by ${triggered.length} rule(s): ${ids}`;
  }
  return `Allowed with ${triggered.length} matched rule(s): ${ids}`;
}
