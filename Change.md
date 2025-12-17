# Change Log

## 2024-11-20
- Added a new headless engine in `engine/` with its own Express server (`engine/server.js`), env example, and README.
  - Exposes HTTP endpoints for project creation, resume, state fetch, and health.
  - Reuses the existing Cofounder DAG (`seq:project:init:v1`) via `api/build.js` with no UI/browser dependencies.
  - Writes state/exports alongside the existing server (`api/db/projects`, `apps/`), using no-op stream hooks to keep current web UI untouched.
- Added a standalone headless entrypoint at `engine/api/server.ts` (no UI deps) with a `/health` endpoint and startup logging; runnable via `node engine/api/server.ts`.
- Implemented first engine feature: `POST /engine/projects` (in-memory) to create a project from user intent and return `{ id, name, intent, status, createdAt }`.
- Added Architecture Decision Engine v1 in `engine/architecture/decider.js` with endpoint `POST /engine/architecture/decide` returning `{ id, frontendStack, backendStack, reasoning[], confidence }` for stacks limited to node-nextjs, node-vite, python-fastapi.
