# Launch Kit

## Recommended Repo Name

Primary recommendation:

- `agent-guard`

Reason:

- short, easy to remember, and directly describes the job of the project
- broad enough to cover Claude Code, Codex, Cursor, MCP, and CI
- better than names that overfit to one runtime or one threat model

Strong alternates:

- `agent-policy`
- `guardraild`
- `mcp-guard`

## One-Line Positioning

Programmable guardrails for coding agents across Claude Code, Codex, MCP, and CI.

## Package Naming

Use:

- GitHub repo: `agent-guard`
- npm package: `agent-guard-cli`

Reason:

- `agent-guard` is stronger branding for the repository
- the unscoped npm package name `agent-guard` is already taken
- `agent-guard-cli` stays close to the repo brand and remains publishable

## GitHub Description

Policy layer for coding agents. Normalize runtime events, evaluate YAML rules, and return explicit allow, warn, or block decisions.

## Topics

Copy from [.github/topics.txt](/Users/arc/iCloud/Documents/macbook/project/claude-code-main/agent-guard/.github/topics.txt).

## Banner

Use [banner.svg](/Users/arc/iCloud/Documents/macbook/project/claude-code-main/agent-guard/assets/banner.svg) as:

- repository social card base
- README hero image
- launch post illustration

## README Hero

```md
![agent-guard banner](./assets/banner.svg)
```

## Launch Post

### Short X / Twitter version

Built `agent-guard`: a policy layer for coding agents.

It sits between Claude Code / Codex / CI and risky actions, normalizes events, evaluates YAML rules, and returns `allow`, `warn`, or `block`.

Useful for:
- destructive shell commands
- secret-bearing file edits
- production MCP access
- oversized generated patches

Repo: `agent-guard`

### Medium LinkedIn / Discord / Forum version

I built `agent-guard`, a small open-source policy layer for coding agents.

The idea is simple: models are good at deciding how to do work, but they should not be the only thing deciding whether a command, edit, or MCP call is allowed to happen.

`agent-guard` takes normalized events from Claude Code, Codex wrappers, GitHub Actions, or MCP gateways, evaluates them against a YAML rule pack, and returns an explicit `allow`, `warn`, or `block` decision.

Current repo includes:

- standalone TypeScript CLI
- baseline guardrail preset
- bundled publishable GitHub Action
- Claude Code and Codex adapter examples
- static landing page

This feels like a useful missing layer between “AI can do things” and “AI should be allowed to do this thing now.”

### Hacker News / README intro version

`agent-guard` is a policy engine for coding agents.

It does not replace Claude Code, Codex, or Cursor. It sits in front of them. You normalize a runtime event into JSON, run it through a rule pack, and get a deterministic decision back: `allow`, `warn`, or `block`.

The main use case is adding explicit control around risky agent actions like destructive shell commands, secret-bearing file edits, production MCP access, and large generated patches in CI.
