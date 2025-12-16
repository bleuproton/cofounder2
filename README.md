![cofounder-og-black](https://github.com/user-attachments/assets/b4e51f02-59e4-4540-ac14-e1f40e20a658)

# Cofounder (alpha)

Cofounder is een experimentele generator voor full‑stack webapps. De `api/` map orkestreert een DAG met LLM‑stappen (product docs → database → backend → UX → React UI). De `dashboard/` map biedt een web‑dashboard om projecten te starten, de flow te volgen, bestanden te bewerken en een ZIP van je projectstaat te downloaden. Genereerde code wordt weggezet in een exportmap op basis van het boilerplate‑skelet.

> Early alpha: dingen veranderen snel, validations zijn minimaal, tokenverbruik kan hoog zijn.

## Repo-overzicht
- `api/` – Express + Socket.IO server, runtime voor de generator, stores in `db/projects/<id>`, serveert het dashboard uit `api/dist`.
- `dashboard/` – Vite + React dashboard (Monaco-editor, flow/console, export, settings). `npm run build` schrijft naar `../api/dist`.
- `boilerplate/` – Bron voor de app die wordt uitgespuugd (`backend/` Express + PGlite, `vitereact/` Vite + React + GenUI plugin) en een root `package.json` met een `dev` script dat beide start.

## Vereisten
- Node 20+ (gebruikt is 22) en npm.
- Minimaal een `OPENAI_API_KEY` (Anthropic optioneel).
- Maak een exportmap (bijv. `mkdir -p apps` in de repo-root).
- Optioneel voor cloud/state: Firebase service account (`FIREBASE_SERVICE_KEY_PATH`) en een GCS bucket voor renders.

## Installatie en basisconfig
1. Installeer dependencies
   ```sh
   cd api && npm install
   cd ../dashboard && npm install
   ```
2. Zet je env in `api/.env`
   ```sh
   cp .env.example .env
   # vul je API keys in
   ```
   Aanbevolen extra vars voor lokaal gebruik:
   ```env
   PORT=4200
   EXPORT_APPS_ROOT=../apps      # map waarin de gegenereerde app terecht komt
   STATE_LOCAL=true              # schrijf projectstaat naar api/db/projects
   AUTOEXPORT_ENABLE=true        # spiegel resultaten naar EXPORT_APPS_ROOT
   AUTOINSTALL_ENABLE=false      # zet op true als je automatisch npm install wilt bij dependency-updates
   DESIGNER_ENABLE=false         # zet op true voor layout renders/uiterlijk iteraties
   LLM_PROVIDER=openai           # of anthropic
   EMBEDDING_MODEL=text-embedding-3-small
   ```
   Optioneel:
   - `COFOUNDER_API_KEY` + `RAG_REMOTE_ENABLE=true` voor remote RAG via api.openinterface.ai.
   - `STATE_CLOUD=true`, `FIREBASE_SERVICE_KEY_PATH`, `GOOGLECLOUDSTORAGE_*` voor cloud state + storage.
3. Bouw het dashboard (schrijft naar `api/dist`)
   ```sh
   cd dashboard
   npm run build
   ```
4. Start de generator/API
   ```sh
   cd ../api
   npm run start
   ```
   Server draait op `http://localhost:4200` en opent automatisch een browser.

## Nieuwe projecten maken
- **Via dashboard**: ga naar `http://localhost:4200`, tab “Projects” → “New Project”. Voer id, beschrijving (verplicht) en optioneel aesthetics in. De flow draait de DAG uit `api/system/structure/sequences/projectInit.yaml` en streamt naar het blueprint/console-scherm.
- **Via CLI** (start ook de server):  
  `npm run start -- -p "mijn-app" -d "wat de app moet doen" -a "bv. licht thema met blauw accent"`
- **Via API**:
  ```sh
  curl -X POST http://localhost:4200/api/projects/new \
    -H "Content-Type: application/json" \
    -d '{"project":"mijn-app","description":"app omschrijving","aesthetics":"optioneel"}'
  ```
- **Resume** na een onderbreking: dashboard “resume” of `POST /api/project/resume` met `{ "project": "<id>" }`.

## Waar alles terechtkomt
- **Projectstaat**: `api/db/projects/<id>/state/**/*.yaml` (product docs, db schema’s, backend specs, UI versies, settings). Dit is wat de Export-tab als ZIP aanbiedt.
- **Gegenereerde app** (als `AUTOEXPORT_ENABLE=true`): `${EXPORT_APPS_ROOT}/<id>/`
  - `backend/` Express + PGlite, evt. `openapi.yaml` / `asyncapi.yaml`, `db.sql`, `.env`.
  - `vitereact/` Vite + React met GenUI component loader (`src/_cofounder/*`).
  - Root `package.json` met `npm run dev` die backend en frontend samen start.

## Gegenereerde app draaien
```sh
cd ${EXPORT_APPS_ROOT}/<id>
npm install          # haalt o.a. 'concurrently' binnen
npm run dev          # start backend (port 1337) + Vite (port 5173)
```
Open `http://localhost:5173`. Laat de cofounder API aan staan als je UI-versies wilt wisselen of regenereren.

### Itereren vanuit de app
De GenUI componenten (`src/_cofounder/genui/genui-view.tsx`) hebben een Cmd/Ctrl+K palette voor:
- versie kiezen van een view (meta.json houdt de keuze bij),
- regenereren/itereren met feedback + optioneel screenshot,
- voorkeur opslaan via `POST /api/project/actions`.
`COFOUNDER_LOCAL_API_BASE_URL` wordt in de Vite plugin vervangen naar `http://localhost:4200/api`; pas `boilerplate/vitereact-boilerplate/src/_cofounder/vite-plugin/index.js` aan als je een andere endpoint wilt (bv. voor productie).

### Dashboard tabs
- **Blueprint**: React Flow van de nodes (pm/db/backend/ux/webapp) plus live node-updates via Socket.IO.
- **Console/Events**: binnenkomende stream chunks per node.
- **Editor**: Monaco-editor over de projectstaat in `api/db/projects/<id>` (list/read/save). Aanmaken/verwijderen van files is nog niet geïmplementeerd.
- **Export**: ZIP van `api/db/projects/<id>`.
- **Settings**: API-keys opslaan naar `api/.env` en thema/caps simulaties (budget/cost UI is mock).
- **Live**: iframe naar `http://localhost:5173` om je app te bekijken terwijl `npm run dev` draait.

## Deployen / installeren van de output
- **Frontend**: `cd apps/<id>/vitereact && npm run build` → deploy de `dist/` naar je host (Netlify/Vercel/nginx). Als je cofounder-acties live wilt houden, update de Vite plugin/base URL.
- **Backend**: `cd apps/<id>/backend && node initdb.js && node server.js` (of eigen process manager). Zet je `.env` daar met de juiste DB/secret waarden.
- **Los van cofounder**: de gegenereerde code is standaard React + Express. Je kunt het los hosten; cofounder API is alleen nodig voor verdere generatie/iteraties vanuit de GenUI componenten.

## Belangrijke omgevingsvariabelen
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `OPENAI_ORG`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`
- `LLM_PROVIDER` (`openai` | `anthropic`), `EMBEDDING_MODEL`
- `PORT` (default 4200), `EXPORT_APPS_ROOT`, `STATE_LOCAL`, `STATE_CLOUD`
- `AUTOEXPORT_ENABLE` (mirror naar exportmap), `AUTOINSTALL_ENABLE` (run `npm i` na package-updates)
- `DESIGNER_ENABLE`, `DESIGNER_DESIGN_SYSTEM`
- `COFOUNDER_API_KEY`, `RAG_REMOTE_ENABLE` (remote RAG), `COFOUNDER_NICKNAME` (prefix prompt)
- `FIREBASE_SERVICE_KEY_PATH`, `GOOGLECLOUDSTORAGE_SERVICE_KEY_PATH`, `GOOGLECLOUDSTORAGE_BUCKET`, `JWT_SECRET`, `SWARM_ENABLE` (voor toekomstige uitbreidingen)

## Architectuur in vogelvlucht
- De generator-DAG staat in `api/system/structure/sequences/projectInit.yaml` (state setup → PRD/FRD/DRD/UXSMD → DB schema/postgres → BRD → OpenAPI/AsyncAPI → backend server → UX datamap/sitemap → Redux store → React root → views).
- Nodeconfig (in/out/concurrency/retries) zit in `api/system/structure/nodes/**`. Functies staan in `api/system/functions/**`.
- State wordt opgeslagen via `op:PROJECT::STATE:UPDATE` als YAML en optioneel naar cloud/Firebase. Exports naar je app-map gebeuren bij events in `config.exports` wanneer `AUTOEXPORT_ENABLE=true`.
- Socket.IO streams sturen start/data/end + state updates naar het dashboard (zie `api/server.js` en `dashboard/src/store/main.tsx`).

## Handige API-routes (lokale base `http://localhost:4200/api`)
- `GET /ping` – healthcheck
- `POST /projects/new` – nieuw project `{project?, description, aesthetics?}`
- `POST /project/resume` – hervat pipeline `{project}`
- `GET /projects/list` – projecten onder `db/projects`
- `GET /editor/files?project=<id>` – lijst bestanden (exclusief node_modules/.git)
- `GET /editor/file?project=<id>&path=<file>` – lees bestand
- `POST /editor/file` – schrijf bestand `{project, path, content}`
- `GET /projects/export/:project` – ZIP van `db/projects/<project>`
- `POST /settings/api` – sla API-settings op naar `.env`
- `POST /project/actions` – interne acties (regen/iterate UI, settings updates)

## Bekende beperkingen
- Alpha: verwacht ruwe randen, weinig foutafhandeling, hoog tokenverbruik.
- Editor kan nog geen bestanden aanmaken/verwijderen.
- Export-API levert de state, niet automatisch de `EXPORT_APPS_ROOT` code.
- Backend boilerplate gebruikt `nodemon` in `npm run start`; pas aan voor productie.
