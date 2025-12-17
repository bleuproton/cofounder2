# Engine HTTP Contract (UI-agnostic)

The headless engine is consumed over HTTP only. No UI or framework-specific types are exposed.

## Base URL
- Default: `http://localhost:4300`
- Configurable via `ENGINE_PORT` (server) and `ENGINE_API_BASE_URL` (clients)

## Resources

### POST `/engine/projects`
- **Purpose:** Create a project from user intent (in-memory, no persistence yet).
- **Request body:**
  ```json
  {
    "intent": "string, required",
    "name": "string, optional"
  }
  ```
- **Response 201:**
  ```json
  {
    "project": {
      "id": "string",
      "name": "string",
      "intent": "string",
      "status": "created",
      "createdAt": "ISO 8601 string"
    }
  }
  ```
- **Errors:** `400` if `intent` is missing/empty.

### GET `/health`
- **Purpose:** Health check.
- **Response 200:**
  ```json
  { "status": "ok", "service": "cofounder-headless-engine", "port": <number> }
  ```

## Boundary Rules
- Engine exposes only HTTP contracts; no React/Next/Vite or browser types.
- Web app and clients must call via HTTP (e.g., `api/utils/engineClient.js`) and must not import engine internals.
- Engine keeps UI concerns out of the API surface; responses are plain JSON domain objects.
