import path from "node:path";
import { parse as parseYaml } from "yaml";
import { collectRuleFiles, readTextFile } from "./files.js";
import {
  EVENT_KINDS,
  type EventKind,
  type GuardRule,
  type MatchCondition,
  type RuleMatchBlock
} from "./types.js";

interface RuleFilePayload {
  rules?: unknown;
}

const VALID_OPERATORS = new Set([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "regex",
  "in",
  "not_in",
  "exists",
  "not_exists"
]);

const VALID_EVENT_KINDS = new Set<string>(EVENT_KINDS);

export async function loadRules(inputPath: string): Promise<GuardRule[]> {
  const files = await collectRuleFiles(inputPath);
  const loaded: GuardRule[] = [];

  for (const filePath of files) {
    const content = await readTextFile(filePath);
    const parsed = parseRuleFile(filePath, content);
    loaded.push(...parsed);
  }

  return loaded
    .filter((rule) => rule.enabled !== false)
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
}

export function parseRuleFile(filePath: string, raw: string): GuardRule[] {
  const extension = path.extname(filePath);
  const document = extension === ".json" ? JSON.parse(raw) : parseYaml(raw);

  const payload = normalizeRuleFileShape(document);
  if (!Array.isArray(payload.rules) || payload.rules.length === 0) {
    throw new Error(`${filePath}: expected a top-level "rules" array`);
  }

  return payload.rules.map((rule, index) =>
    normalizeRule(rule, `${filePath}#rules[${index}]`)
  );
}

function normalizeRuleFileShape(document: unknown): RuleFilePayload {
  if (Array.isArray(document)) {
    return { rules: document };
  }

  if (typeof document === "object" && document !== null) {
    return document as RuleFilePayload;
  }

  throw new Error("rule file must be an object or an array");
}

function normalizeRule(input: unknown, context: string): GuardRule {
  if (typeof input !== "object" || input === null) {
    throw new Error(`${context}: rule must be an object`);
  }

  const candidate = input as Record<string, unknown>;
  const id = requireString(candidate.id, `${context}.id`);
  const action = requireRuleAction(candidate.action, `${context}.action`);
  const message = requireString(candidate.message, `${context}.message`);
  const match = normalizeMatch(candidate.match, `${context}.match`);
  const appliesTo = normalizeAppliesTo(candidate.appliesTo, `${context}.appliesTo`);
  const enabled = optionalBoolean(candidate.enabled, `${context}.enabled`);
  const priority = optionalNumber(candidate.priority, `${context}.priority`);
  const description = optionalString(candidate.description, `${context}.description`);

  return {
    id,
    action,
    message,
    match,
    appliesTo,
    enabled,
    priority,
    description,
    metadata:
      typeof candidate.metadata === "object" && candidate.metadata !== null
        ? (candidate.metadata as Record<string, unknown>)
        : undefined
  };
}

function normalizeMatch(input: unknown, context: string): RuleMatchBlock {
  if (typeof input !== "object" || input === null) {
    throw new Error(`${context}: match must be an object`);
  }

  const candidate = input as Record<string, unknown>;
  const all = normalizeConditionArray(candidate.all, `${context}.all`);
  const any = normalizeConditionArray(candidate.any, `${context}.any`);

  if (all.length === 0 && any.length === 0) {
    throw new Error(`${context}: match must define "all", "any", or both`);
  }

  return {
    all: all.length > 0 ? all : undefined,
    any: any.length > 0 ? any : undefined
  };
}

function normalizeConditionArray(input: unknown, context: string): MatchCondition[] {
  if (input === undefined) {
    return [];
  }

  if (!Array.isArray(input)) {
    throw new Error(`${context}: must be an array`);
  }

  return input.map((condition, index) =>
    normalizeCondition(condition, `${context}[${index}]`)
  );
}

function normalizeCondition(input: unknown, context: string): MatchCondition {
  if (typeof input !== "object" || input === null) {
    throw new Error(`${context}: condition must be an object`);
  }

  const candidate = input as Record<string, unknown>;
  const field = requireString(candidate.field, `${context}.field`);
  const operator = requireOperator(candidate.operator, `${context}.operator`);
  const ignoreCase = optionalBoolean(candidate.ignoreCase, `${context}.ignoreCase`);

  if (operator === "exists" || operator === "not_exists") {
    return { field, operator, ignoreCase };
  }

  return {
    field,
    operator,
    value: candidate.value as MatchCondition["value"],
    ignoreCase
  };
}

function normalizeAppliesTo(input: unknown, context: string): EventKind[] | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (!Array.isArray(input)) {
    throw new Error(`${context}: must be an array`);
  }

  const normalized = input.map((value, index) => {
    const item = requireString(value, `${context}[${index}]`);
    if (!VALID_EVENT_KINDS.has(item)) {
      throw new Error(`${context}[${index}]: unsupported event kind "${item}"`);
    }
    return item as EventKind;
  });

  return normalized;
}

function requireRuleAction(input: unknown, context: string): GuardRule["action"] {
  const value = requireString(input, context);
  if (value !== "warn" && value !== "block") {
    throw new Error(`${context}: expected "warn" or "block"`);
  }
  return value;
}

function requireOperator(input: unknown, context: string): MatchCondition["operator"] {
  const value = requireString(input, context);
  if (!VALID_OPERATORS.has(value)) {
    throw new Error(`${context}: unsupported operator "${value}"`);
  }
  return value as MatchCondition["operator"];
}

function requireString(input: unknown, context: string): string {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error(`${context}: expected a non-empty string`);
  }
  return input;
}

function optionalString(input: unknown, context: string): string | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "string") {
    throw new Error(`${context}: expected a string`);
  }

  return input;
}

function optionalBoolean(input: unknown, context: string): boolean | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "boolean") {
    throw new Error(`${context}: expected a boolean`);
  }

  return input;
}

function optionalNumber(input: unknown, context: string): number | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "number" || Number.isNaN(input)) {
    throw new Error(`${context}: expected a number`);
  }

  return input;
}
