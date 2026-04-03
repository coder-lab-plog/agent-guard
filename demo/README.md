# Demo

This folder is for demos you can record for GitHub, X, Discord, or a launch video.

## Fast terminal demo

```bash
npm install
npm run demo:run
```

That script shows:

- Claude Code payload normalization
- Codex payload normalization
- blocked dangerous actions
- allowed safe actions
- the bundled GitHub Action entrypoint returning the same contract

## Prepared artifacts

Generate normalized events and JSON evaluation outputs:

```bash
npm run demo:prepare
```

Artifacts land in:

- `demo/generated/events`
- `demo/generated/results`

## Recording idea

The simplest launch clip is:

1. Open the repo banner in the browser
2. Run `npm run demo:run`
3. Scroll the landing page at `site/`
4. End on the README banner and the Action example

That gives you a tight 20-40 second product demo without inventing fake UI.
