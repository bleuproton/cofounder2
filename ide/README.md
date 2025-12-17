# Cofounder Studio (MVP, Theia-based)

Thin client for the headless engine. This IDE adapts UI to engine mode and never bypasses engine policies.

## Why Theia
- Open, extensible, Electron-ready.
- Easy to disable terminals/explorer based on mode.
- Familiar widget model for custom panels.

## Architecture
- `packages/cofounder-extension`: custom Theia frontend extension (mode display, agent actions, sandbox controls, logs).
- Engine-facing: HTTP calls only (`/engine/mode/current`, `/engine/agents/run`, `/engine/sandbox/*`).
- Policies: enforced in engine; UI only hides/limits features per mode response.

## Mode-based UI expectations
- Guided: hide terminal, hide explorer; show mode + limited agent/sandbox controls.
- Builder: limited explorer; no raw shell; agent/sandbox enabled.
- Developer: full features; still obey engine responses and CPS.

## How to run (scaffold placeholder)
This repo contains the structure and extension skeleton; install Theia deps before building:
```sh
cd ide
npm install
npm run build
# then configure Theia electron packaging per @theia/cli docs
```

## Safety
- No direct file writes; all mutations go through engine endpoints.
- CPS and policies stay server-side; the IDE is read-only on mode data and adapts UI accordingly.
