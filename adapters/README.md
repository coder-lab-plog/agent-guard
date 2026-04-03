# Adapters

`agent-guard` evaluates a normalized event shape. Real agent runtimes rarely emit that shape directly, so this directory contains small adapter scripts that translate external payloads into `agent-guard` events.

These adapters are intentionally thin:

- they do not execute rules
- they do not block anything by themselves
- they only normalize payloads into a stable JSON event file

## Included examples

### Claude Code

The Claude Code adapter expects a JSON payload shaped like a hook payload, then maps it into the generic schema:

```bash
node adapters/claude-code/normalize-event.mjs \
  examples/adapters/claude-code-hook.json \
  .agent-guard/events/claude-code.json
```

### Codex

The Codex adapter expects a wrapper-captured event payload and converts it into the same generic schema:

```bash
node adapters/codex/normalize-event.mjs \
  examples/adapters/codex-wrapper-event.json \
  .agent-guard/events/codex.json
```

After normalization, evaluate with the CLI:

```bash
node dist/src/cli/main.js eval \
  --rules presets/baseline.yml \
  --input .agent-guard/events/codex.json
```

## Why adapters matter

This is what makes `agent-guard` vendor-neutral. Each adapter knows how to translate local runtime details into the same policy envelope, so the rule engine does not need to care whether the event came from Claude Code, Codex, Cursor, or a CI wrapper.
