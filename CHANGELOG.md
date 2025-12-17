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

## 2024-11-20 — [Retroactive Entry] Engine HTTP Surface & Contracts
- **Files added:** `engine/api/server.ts`, `engine/contracts/http.md`
- **Files modified:** `Change.md`
- **Reasoning:** Documented and implemented the engine’s HTTP-only surface (health, projects, architecture decisions) to enforce UI independence and clear client boundaries. Chose HTTP contracts over shared libraries to avoid framework lock-in and keep the engine usable by web/IDE/iOS.
- **Impact:** Clarified integration points for non-web clients; deferred auth, persistence, and streaming interfaces until the engine matures.
