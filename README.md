# Cofounder (alpha)

Cofounder is an experimental generator for full-stack web apps. The `api/` folder orchestrates a DAG of LLM steps (product docs → database → backend → UX → React UI). The `dashboard/` folder provides a web dashboard to start projects, follow the flow, edit files, and download a ZIP of your project state. Generated code is written to an export directory based on the boilerplate skeleton.

Early alpha: things change quickly, validations are minimal, and token usage can be high.

## Repo overview

* api/ – Express + Socket.IO server, runtime for the generator, stores data in db/projects/<id>, serves the dashboard from api/dist.
* dashboard/ – Vite + React dashboard (Monaco editor, flow/console, export, settings). npm run build writes to ../api/dist.
* boilerplate/ – Source for the generated app (backend/ Express + PGlite, vitereact/ Vite + React + GenUI plugin) and a root package.json with a dev script that starts both.
* engine/ – Headless engine (UI-agnostic) invoked over HTTP by web, IDE, and iOS clients.

### Engine contents

* api/server.js – standalone entrypoint (health, projects, ADE, contracts).
* architecture/decider.js – Architecture Decision Engine (deterministic stack selection).
* projects/contractGenerator.js – Project Contract Generator (services, commands, ports).
* contracts/http.md – HTTP contract for clients (no UI types).

## Requirements

* Node 20+ (22 used) and npm.
* At least an OPENAI_API_KEY (Anthropic optional).
* Create an export directory (for example mkdir -p apps in the repo root).
* Optional cloud/state support via Firebase and Google Cloud Storage.

## Installation and basic setup

1. Install dependencies

cd api && npm install
cd ../dashboard && npm install

2. Environment configuration (api/.env)

cp .env.example .env

Recommended local variables:

PORT=4200
EXPORT_APPS_ROOT=../apps
STATE_LOCAL=true
AUTOEXPORT_ENABLE=true
AUTOINSTALL_ENABLE=false
DESIGNER_ENABLE=false
LLM_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

Optional:

* COFOUNDER_API_KEY + RAG_REMOTE_ENABLE=true for remote RAG.
* STATE_CLOUD, FIREBASE_SERVICE_KEY_PATH, GOOGLECLOUDSTORAGE_* for cloud state.

3. Build dashboard

cd dashboard
npm run build

4. Start API

cd ../api
npm run start

Server runs at [http://localhost:4200](http://localhost:4200)

## Headless engine

Install once:

cd engine && npm install

Run:

node api/server.js

Health:

curl [http://localhost:4300/health](http://localhost:4300/health)

## Engine HTTP endpoints

POST /engine/architecture/decide
Input: { intent }
Output: decision { id, frontendStack, backendStack, reasoning, confidence }

POST /engine/projects/contract
Input: { decision }
Output: contract { services, commands, ports, relationships }

POST /engine/projects
Input: { intent, name }
Output: { project }

GET /health

## Engine design rationale

* UI-agnostic, HTTP-only contracts.
* Clear separation between architecture decisions and execution.
* Reusable across web, IDE, and mobile clients.

## Creating projects

Dashboard:

[http://localhost:4200](http://localhost:4200) → Projects → New Project

CLI:

npm run start -- -p "my-app" -d "description" -a "aesthetics"

API:

POST /api/projects/new

Resume:

POST /api/project/resume

## Project output

Project state:

api/db/projects/<id>/state/**/*.yaml

Generated app (AUTOEXPORT_ENABLE=true):

EXPORT_APPS_ROOT/<id>/

* backend/ (Express + PGlite)
* vitereact/ (Vite + React + GenUI)
* root package.json

## Running generated app

cd EXPORT_APPS_ROOT/<id>
npm install
npm run dev

Frontend: [http://localhost:5173](http://localhost:5173)
Backend: [http://localhost:1337](http://localhost:1337)

## Iteration via GenUI

Cmd or Ctrl + K palette for:

* switching view versions
* regenerating with feedback
* saving preferences

## Dashboard tabs

* Blueprint: flow graph with live updates
* Console: streaming logs
* Editor: Monaco editor for state files
* Export: ZIP download
* Settings: API keys and UI options
* Live: iframe preview

## Deployment

Frontend:

npm run build → deploy dist/

Backend:

node initdb.js
node server.js

Standalone hosting supported.

## Important environment variables

OPENAI_API_KEY
ANTHROPIC_API_KEY
LLM_PROVIDER
PORT
EXPORT_APPS_ROOT
STATE_LOCAL
STATE_CLOUD
AUTOEXPORT_ENABLE
AUTOINSTALL_ENABLE
DESIGNER_ENABLE
COFOUNDER_API_KEY
RAG_REMOTE_ENABLE
JWT_SECRET

## Architecture overview

* DAG defined in api/system/structure/sequences/projectInit.yaml
* Nodes in api/system/structure/nodes
* Functions in api/system/functions
* State stored as YAML and streamed via Socket.IO

## Useful API routes

GET /ping
POST /projects/new
POST /project/resume
GET /projects/list
GET /editor/files
GET /editor/file
POST /editor/file
GET /projects/export/:project
POST /settings/api
POST /project/actions

## Known limitations

* Alpha quality
* High token usage
* Editor cannot create or delete files
* Export API only returns state
* nodemon used in backend boilerplate
