# Changelog

## 2024-11-20 — [Retroactive Entry] Headless Engine Bootstrap
- **Files added:** `engine/README.md`, `engine/.env.example`, `engine/package.json`, `engine/server.js`
- **Files modified:** `Change.md`
- **Reasoning:** Established a UI-agnostic headless runtime (Express-based) with health checks and startup logging to allow non-web clients (web/IDE/iOS) to drive Cofounder without coupling. Provided env scaffolding and docs to run the engine alongside the existing app while keeping behavior unchanged.
- **Impact:** Enabled a standalone engine process consumable over HTTP; intentionally deferred auth, persistence, and any UI coupling.

## 2024-11-20 — [Retroactive Entry] Engine Client Integration (Fallback Safe)
- **Files added:** `api/utils/engineClient.js`
- **Files modified:** `api/server.js`, `api/.env.example`, `Change.md`
- **Reasoning:** Introduced a minimal HTTP client for the headless engine and routed project creation to call the engine when available, with logging and strict fallback to the legacy generator to avoid regressions. Added optional env to point to the engine base URL.
- **Impact:** Let the web app opportunistically record intent in the engine without breaking existing flows; deferred moving any generation logic or UI behavior into the engine.

## 2024-11-20 — [Retroactive Entry] Architecture Decision Engine v1
- **Files added:** `engine/architecture/decider.js`, `engine/contracts/http.md`
- **Files modified:** `engine/api/server.ts`, `Change.md`
- **Reasoning:** Introduced the first ADE logic to keep stack selection deterministic and explainable (only `node-nextjs`, `node-vite`, `python-fastapi`), exposed via `POST /engine/architecture/decide`, and documented the HTTP boundary so clients consume the engine over HTTP without UI coupling. Updated existing server wiring and change documentation to reflect the new endpoint and contract.
- **Impact:** Enabled architecture recommendations over HTTP for all clients; deferred code scaffolding, database assumptions, and additional stacks.

## 2024-11-20 — Project Contract Generator v1
- **Files added:** `engine/projects/contractGenerator.js`
- **Files modified:** `engine/api/server.ts`, `CHANGELOG.md`
- **Reasoning:** Added a deterministic, ADE-driven Project Contract layer to describe services/stacks/commands/ports for supported stacks (`node-nextjs`, `node-vite`, `python-fastapi`). Kept it separate from ADE to cleanly layer decision (what to build) from contract (how to run/build services) and to avoid UI coupling.
- **Impact:** Provides a structured contract over HTTP (`POST /engine/projects/contract`) for downstream scaffolding/adapters/sandbox work; intentionally deferred databases, deployment targets, and any code generation.

## 2024-11-20 — Engine Runtime Entry Fix
- **Files added:** `engine/api/server.js`
- **Files modified:** `engine/package.json`, `CHANGELOG.md`
- **Reasoning:** Provide a native JS entrypoint to run the headless engine without experimental flags or TS loaders, improving reliability for local/test runs while keeping the TypeScript source available.
- **Impact:** Simplifies `npm start` and `node api/server.js` execution; avoids missing-dependency/loader errors. Deferred any refactor of the existing `.ts` source until a full TS toolchain is adopted.

## 2025-12-17 — Engine README update (usage & intent)
- **Files modified:** `README.md`
- **Reasoning:** Documented how to operate the headless engine (start/stop, endpoints, purpose, layering rationale) to keep UI coupling out and make it consumable by web/IDE/iOS clients.
- **Impact:** Clarifies run instructions and intent; no runtime changes.

## 2025-12-17 — Adapter System v1
- **Files added:** `engine/adapters/index.js`, `engine/adapters/nodeNextAdapter.js`, `engine/adapters/nodeViteAdapter.js`, `engine/adapters/pythonFastapiAdapter.js`
- **Files modified:** `engine/api/server.js`, `engine/api/server.ts`, `CHANGELOG.md`
- **Reasoning:** Introduced deterministic, non-AI adapters to scaffold minimal project structures from Project Contracts for supported stacks (`node-nextjs`, `node-vite`, `python-fastapi`). Adapters are a separate layer to translate contracts into filesystem scaffolds without touching web UI and without AI, keeping repeatability and safety.
- **Impact:** Enables `POST /engine/adapters/scaffold` to create minimal service directories (essential files only) for downstream agents/sandbox/IDE flows; intentionally deferred business logic, databases, auth, deploy, and Docker.

## 2025-12-18 — Canonical Project Structure (CPS) v1
- **Files added:** `engine/structure/cps.js`
- **Files modified:** `engine/adapters/index.js`, `engine/api/server.js`, `engine/api/server.ts`, `CHANGELOG.md`
- **Reasoning:** Enforced a canonical, versioned project layout (structureVersion 1.0) with `cofounder.json` at project root and `service.json` per service, under `services/`. Adapters now scaffold only inside the allowed CPS paths and fail on violations. AI is intentionally excluded from structure decisions to keep repeatability and tooling safety; frameworks are nested under services to keep UI/backend symmetry and isolation.
- **Impact:** Safer scaffolding for IDEs/agents/sandbox: deterministic paths, manifests, and validation during scaffold. Enables future automated checks, adapters, and runners without risking UI coupling. Deferred databases, deploy/Docker, and business logic.

## 2025-12-18 — Agent Runtime v1 (diff-based, CPS-safe)
- **Files added:** `engine/agents/diff.js`, `engine/agents/runtime.js`
- **Files modified:** `engine/api/server.js`, `engine/api/server.ts`, `engine/adapters/index.js`, `CHANGELOG.md`
- **Reasoning:** Introduced a diff-based Agent Runtime that only applies validated changes inside `services/<service>/src`, enforcing CPS boundaries and forbidding structure edits, manifest changes, deletes, or shell execution. Diffs are required; AI does not write files directly. CPS rules prevent agents from bypassing project layout.
- **Impact:** Enables `POST /engine/agents/run` / `GET /engine/agents/runs/:id` for controlled agent edits, with explicit errors on violations. Sets the stage for IDE/agent workflows while preserving safety and determinism.

## 2025-12-18 — Policies & Modes v1 (engine-enforced)
- **Files added:** `engine/policies/index.js`
- **Files modified:** `engine/agents/runtime.js`, `engine/agents/diff.js`, `engine/api/server.js`, `engine/api/server.ts`, `CHANGELOG.md`
- **Reasoning:** Added engine-level policy enforcement with fixed modes (`guided`, `builder`, `developer`) to control capabilities (agent.run, agent.applyDiff, sandbox, file ops, service run). Policies live in the engine so UI cannot override them; AI codegen is still disallowed from changing structure. File deletes remain forbidden except in `developer` mode and still constrained to src paths.
- **Impact:** Mode-aware endpoints (`/engine/mode/set`, `/engine/mode/current`) and capability checks gate all agent diff application. This keeps CPS intact, blocks structure/manifest edits, and enables IDE/non-coder safety while preparing for future sandbox/service controls. No breaking changes to web app.

## 2025-12-18 — Cofounder Studio (Theia-based MVP, thin client)
- **Files added:** `ide/README.md`, `ide/package.json`, `ide/tsconfig.base.json`, `ide/packages/cofounder-extension/package.json`, `ide/packages/cofounder-extension/tsconfig.json`, `ide/packages/cofounder-extension/src/browser/cofounder-frontend-module.ts`, `ide/packages/cofounder-extension/src/browser/cofounder-widget.tsx`
- **Reasoning:** Introduced a Theia-based IDE skeleton as a thin client to the engine: UI adapts to engine modes, shows mode/capabilities, triggers agent runs, and sandbox start/stop via HTTP. Policies remain enforced in the engine; the IDE cannot override CPS or modes. Theia chosen for extensibility and easy feature gating (hide terminal/explorer in guided, limit in builder, full in developer).
- **Impact:** Provides a foundation for an AI-first orchestration UI without weakening engine security. Terminal/shell omitted in guided/builder, and file actions remain governed by engine endpoints. Deployment, terminals, and full editor wiring are intentionally deferred for safety.

## 2025-12-19 — Cofounder Studio doc update (mode-driven UI, thin-client scope)
- **Files modified:** `ide/README.md`, `CHANGELOG.md`
- **Reasoning:** Documented the IDE folder layout, widget behavior, and mode-based UI gating to reinforce that Studio is a strict client of the engine. Theia is kept for extensibility and feature gating; modes are respected from engine responses, not overridden by UI. Excluded unrestricted terminals and direct file access to maintain CPS/policy safety.
- **Impact:** Clearer guidance for IDE consumers (web/desktop) without changing engine behavior or policies; future work (full editor wiring, packaging) remains out of scope for this MVP.

## 2025-12-19 — Runtime note: API port conflict guidance
- **Files modified:** `CHANGELOG.md`
- **Reasoning:** Documented the fix for `EADDRINUSE` on `::4200` (API already bound): either stop the other process using 4200 or start the API with a different `PORT` (e.g., `PORT=4301 npm run start`). Engine/web app behavior unchanged; policies/CPS remain enforced.
- **Impact:** Operational guidance only; no code changes. Avoids crashes when multiple instances run concurrently.

## 2024-11-20 — [Retroactive Entry] Engine HTTP Surface & Contracts
- **Files added:** `engine/api/server.ts`, `engine/contracts/http.md`
- **Files modified:** `Change.md`
- **Reasoning:** Documented and implemented the engine’s HTTP-only surface (health, projects, architecture decisions) to enforce UI independence and clear client boundaries. Chose HTTP contracts over shared libraries to avoid framework lock-in and keep the engine usable by web/IDE/iOS.
- **Impact:** Clarified integration points for non-web clients; deferred auth, persistence, and streaming interfaces until the engine matures.
