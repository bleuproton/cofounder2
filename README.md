# Cofounder (Alpha)

Cofounder is an experimental **full-stack web app generator** powered by LLMs. It orchestrates a deterministic, multi-step generation pipeline that turns a plain-language product idea into a runnable React + backend application.

The system is split into a **generator runtime**, a **web dashboard**, and a **headless engine** that can be reused by web, IDE, or mobile clients.

> ⚠️ **Early alpha**: Expect breaking changes, limited validation, rough edges, and potentially high token usage.

---

## ✨ What Cofounder Does

* Transforms product intent into a full-stack application
* Uses a DAG of LLM steps (PRD → DB → Backend → UX → UI)
* Generates **real, editable code** (React + Express)
* Keeps **architecture decisions deterministic and explainable**
* Supports regeneration and iteration without losing state

---

## 🧱 Repository Structure

```
.
├── api/            # Generator runtime (Express + Socket.IO)
├── dashboard/      # Web dashboard (Vite + React)
├── engine/         # Headless HTTP engine (UI-agnostic)
├── boilerplate/    # Source skeleton for generated apps
└── apps/           # (Optional) Export destination for generated projects
```

### `api/`

* Express + Socket.IO server
* Orchestrates the generation DAG
* Stores project state in `db/projects/<id>`
* Serves the built dashboard from `api/dist`

### `dashboard/`

* Vite + React
* Monaco editor, live flow graph, console output
* Export + settings UI
* `npm run build` outputs to `../api/dist`

### `engine/`

A **headless, UI-agnostic engine** accessed over HTTP.

* Can be used by web, IDE, or mobile clients
* Contains no React, Vite, or Next.js types

Key files:

* `api/server.js` – standalone engine server
* `architecture/decider.js` – Architecture Decision Engine (ADE)
* `projects/contractGenerator.js` – Project Contract Generator
* `contracts/http.md` – HTTP-only client contract

### `boilerplate/`

The base app that gets cloned and filled:

* `backend/` – Express + PGlite
* `vitereact/` – Vite + React + GenUI plugin
* Root `package.json` with a `dev` script to run both

---

## 🚀 Quick Start

### Requirements

* Node.js **20+** (tested with 22)
* npm
* `OPENAI_API_KEY` (Anthropic optional)

Optional:

* Firebase + GCS for cloud state

---

### Installation

```bash
# Install dependencies
cd api && npm install
cd ../dashboard && npm install
```

---

### Environment Setup

Create `api/.env`:

```env
PORT=4200
OPENAI_API_KEY=your_key_here
EXPORT_APPS_ROOT=../apps
STATE_LOCAL=true
AUTOEXPORT_ENABLE=true
AUTOINSTALL_ENABLE=false
DESIGNER_ENABLE=false
LLM_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
```

Optional:

* `COFOUNDER_API_KEY` + `RAG_REMOTE_ENABLE=true` (remote RAG)
* `STATE_CLOUD=true` + Firebase / GCS credentials

---

### Build Dashboard

```bash
cd dashboard
npm run build
```

---

### Start the Generator

```bash
cd ../api
npm run start
```

The server runs at:

```
http://localhost:4200
```

---

## 🧠 Headless Engine

The engine can run independently without the dashboard.

### Install (once)

```bash
cd engine && npm install
```

### Run

```bash
node api/server.js
# or
ENGINE_PORT=4300 node api/server.js
```

### Health Check

```bash
curl http://localhost:4300/health
```

---

### Engine HTTP Endpoints

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| POST   | `/engine/architecture/decide` | Decide frontend + backend stack |
| POST   | `/engine/projects/contract`   | Generate project contract       |
| POST   | `/engine/projects`            | Create in-memory project        |
| GET    | `/health`                     | Health check                    |

---

## 🏗 Architecture Philosophy

* **UI-agnostic**: engine exposes only HTTP contracts
* **Deterministic decisions**: same intent → same stack
* **Separation of concerns**:

  * *What*: architecture & stack choice
  * *How*: contracts & execution

This allows the same engine to power web, IDE, and mobile experiences.

---

## 📦 Creating a Project

### Dashboard

Open:

```
http://localhost:4200
```

Go to **Projects → New Project** and provide:

* Project ID
* Description (required)
* Optional aesthetics

---

### CLI

```bash
npm run start -- \
  -p "my-app" \
  -d "What the app should do" \
  -a "Light theme with blue accent"
```

---

### API

```bash
curl -X POST http://localhost:4200/api/projects/new \
  -H "Content-Type: application/json" \
  -d '{"project":"my-app","description":"App description"}'
```

---

### Resume a Project

```bash
POST /api/project/resume
```

---

## 📂 Output Structure

### Project State

```
api/db/projects/<id>/state/**/*.yaml
```

Contains:

* Product docs
* DB schemas
* Backend specs
* UI versions

---

### Generated App

If `AUTOEXPORT_ENABLE=true`:

```
apps/<id>/
├── backend/
├── vitereact/
└── package.json
```

---

## ▶️ Running the Generated App

```bash
cd apps/<id>
npm install
npm run dev
```

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend: [http://localhost:1337](http://localhost:1337)

---

## 🔁 Iterating via GenUI

Inside the generated app:

* Press **Cmd/Ctrl + K**
* Switch UI versions
* Regenerate with feedback
* Persist preferences back to Cofounder

---

## 🖥 Dashboard Tabs

* **Blueprint** – Live DAG visualization
* **Console** – Streaming LLM output
* **Editor** – Monaco editor for state files
* **Export** – ZIP download of project state
* **Settings** – API keys and UI simulation
* **Live** – iframe preview of running app

---

## 🚢 Deployment

### Frontend

```bash
cd apps/<id>/vitereact
npm run build
```

Deploy `dist/` to Netlify, Vercel, or nginx.

---

### Backend

```bash
cd apps/<id>/backend
node initdb.js
node server.js
```

Use your preferred process manager for production.

---

## 🔐 Key Environment Variables

* `OPENAI_API_KEY`
* `ANTHROPIC_API_KEY`
* `LLM_PROVIDER`
* `PORT`
* `EXPORT_APPS_ROOT`
* `STATE_LOCAL` / `STATE_CLOUD`
* `AUTOEXPORT_ENABLE`
* `AUTOINSTALL_ENABLE`
* `DESIGNER_ENABLE`
* `COFOUNDER_API_KEY`
* `RAG_REMOTE_ENABLE`
* `JWT_SECRET`

---

## ⚠️ Known Limitations

* Alpha-quality software
* Limited error handling
* High token usage possible
* Editor cannot yet create or delete files
* Export API returns state only (not app code)
* Backend boilerplate uses `nodemon` by default

---

## 📄 License

TBD
