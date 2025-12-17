# Cofounder Headless Engine (alpha)

UI-vrije entrypoint om de Cofounder generator via HTTP te gebruiken. Draait parallel aan de bestaande `api/` server en gebruikt dezelfde system/nodes uit `api/`.

## Snelstart
```sh
cd engine
cp .env.example .env          # pas paden/keys aan
npm install
npm start                     # default: http://localhost:4300
```

Belangrijke env-vars (zie `.env.example`):
- `ENGINE_PORT` – poort voor de headless API (default 4300).
- `ENGINE_STATE_ROOT` – pad waar projectstate wordt weggeschreven (`../api/db/projects`).
- `ENGINE_EXPORT_APPS_ROOT` – pad voor exports (`../apps`). Wordt als fallback gebruikt voor `EXPORT_APPS_ROOT`.
- `STATE_LOCAL` (fallback `true`) – aanzetten om YAML-state lokaal te schrijven.
- API keys: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `ANTHROPIC_*` zoals in `api/.env`.

## Endpoints
- `GET /health` – status + paden.
- `GET /v1/projects` – lijst projecten uit `ENGINE_STATE_ROOT`.
- `GET /v1/projects/:project/state` – samengevoegde state + keymap voor één project.
- `POST /v1/projects` – start nieuwe run.
  ```json
  { "project": "optionele-id", "description": "beschrijving", "aesthetics": "optioneel" }
  ```
  Response: `202 Accepted { project, started, statePath, exportPath }` (run gebeurt async).
- `POST /v1/projects/:project/resume` – hervat run vanaf laatst bekende stap.

## Hoe dit samenwerkt met de bestaande app
- De engine importeert `api/build.js` en hergebruikt dezelfde DAG `seq:project:init:v1`.
- Geen React/browser afhankelijkheden; enkel Express + YAML.
- Exports en state blijven op dezelfde plekken als de bestaande server, zodat de dashboard/webapp ongewijzigd blijft.
- No-op stream handlers voorkomen socket afhankelijkheden; bestaande web UI blijft leidend voor live streams.

## Delegatiepad
- Bestaande webapp blijft werken via `api/`.
- Nieuwe clients (CLI, IDE, iOS) kunnen direct tegen deze headless API praten.
- Functionaliteit kan stapsgewijs naar de engine verplaatst worden; zolang een feature hier niet bestaat, gebruik je de bestaande `api/` endpoints.
