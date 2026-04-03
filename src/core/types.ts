export const EVENT_KINDS = [
  "prompt",
  "tool_call",
  "file_write",
  "mcp_call",
  "stop",
  "session"
] as const;

export type EventKind = (typeof EVENT_KINDS)[number];
export type RuleAction = "warn" | "block";
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "regex"
  | "in"
  | "not_in"
  | "exists"
  | "not_exists";

export interface AgentEvent {
  kind: EventKind;
  source?: string;
  agent?: string;
  toolName?: string;
  command?: string;
  filePath?: string;
  content?: string;
  prompt?: string;
  transcript?: string;
  mcpServer?: string;
  mcpTool?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface MatchCondition {
  field: string;
  operator: ConditionOperator;
  value?: string | number | boolean | Array<string | number | boolean>;
  ignoreCase?: boolean;
}

export interface RuleMatchBlock {
  all?: MatchCondition[];
  any?: MatchCondition[];
}

export interface GuardRule {
  id: string;
  description?: string;
  enabled?: boolean;
  appliesTo?: EventKind[];
  action: RuleAction;
  priority?: number;
  match: RuleMatchBlock;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface TriggeredRule {
  rule: GuardRule;
  reasons: string[];
}

export interface EvaluationResult {
  decision: "allow" | "warn" | "block";
  summary: string;
  triggered: TriggeredRule[];
  stats: {
    loadedRules: number;
    matchedRules: number;
  };
}
