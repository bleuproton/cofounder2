import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { decideArchitecture } from "../architecture/decider.js";
import { generateProjectContract } from "../projects/contractGenerator.js";
import adapters from "../adapters/index.js";
import agentRuntime from "../agents/runtime.js";
import policies from "../policies/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.ENGINE_PORT || 4300;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// In-memory project store (no persistence yet)
const projects = [];

function slugify(text = "") {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w\-]+/g, "")
		.replace(/\-\-+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "");
}

function makeProject({ intent, name }) {
	const createdAt = new Date().toISOString();
	const base = name?.length
		? slugify(name)
		: slugify(
				intent
					.split(" ")
					.slice(0, 6)
					.join(" "),
			) || "project";
	const id = `${base}-${Date.now()}`;
	return {
		id,
		name: name?.length ? name : intent.slice(0, 60) || "New project",
		intent,
		status: "created",
		createdAt,
	};
}

app.get("/health", (_req, res) => {
	res.status(200).json({
		status: "ok",
		service: "cofounder-headless-engine",
		port: PORT,
	});
});

app.post("/engine/projects", (req, res) => {
	const { intent, name } = req.body || {};
	if (!intent || typeof intent !== "string" || !intent.trim().length) {
		return res.status(400).json({ error: "intent (string) is required" });
	}
	const project = makeProject({ intent: intent.trim(), name: name?.trim() });
	projects.push(project);
	res.status(201).json({ project });
});

app.post("/engine/architecture/decide", (req, res) => {
	try {
		const { intent } = req.body || {};
		if (!intent || typeof intent !== "string" || !intent.trim().length) {
			return res.status(400).json({ error: "intent (string) is required" });
		}
		const decision = decideArchitecture(intent);
		res.status(200).json({ decision });
	} catch (error) {
		res
			.status(500)
			. json({ error: error?.message || "failed to run architecture decision" });
	}
});

app.post("/engine/projects/contract", (req, res) => {
	try {
		const { decision } = req.body || {};
		if (!decision) {
			return res
				.status(400)
				.json({ error: "decision object from ADE is required" });
		}
		const contract = generateProjectContract(decision);
		res.status(200).json({ contract });
	} catch (error) {
		res.status(400).json({
			error: error?.message || "failed to generate project contract",
		});
	}
});

app.post("/engine/adapters/scaffold", (req, res) => {
	try {
		const { projectId, contract } = req.body || {};
		if (!projectId) {
			return res.status(400).json({ error: "projectId is required" });
		}
		if (!contract) {
			return res.status(400).json({ error: "contract is required" });
		}
		const { paths, projectRoot } = adapters.scaffoldContract({ projectId, contract });
		res.status(200).json({ projectId, paths, root: projectRoot, status: "scaffolded" });
	} catch (error) {
		res.status(400).json({ error: error?.message || "failed to scaffold" });
	}
});

app.post("/engine/agents/run", (req, res) => {
	try {
		const { projectId, service, task, diff } = req.body || {};
		if (!diff) {
			return res.status(400).json({ error: "diff (unified diff) is required" });
		}
		const run = agentRuntime.runAgentTask({
			projectId,
			service,
			task,
			diffText: diff,
		});
		res.status(200).json(run);
	} catch (error) {
		res.status(400).json({ error: error?.message || "failed to run agent task" });
	}
});

app.get("/engine/agents/runs/:id", (req, res) => {
	const run = agentRuntime.getRun(req.params.id);
	if (!run) return res.status(404).json({ error: "run not found" });
	res.status(200).json(run);
});

app.post("/engine/mode/set", (req, res) => {
	try {
		const { projectId, mode } = req.body || {};
		if (!projectId) return res.status(400).json({ error: "projectId is required" });
		if (!mode) return res.status(400).json({ error: "mode is required" });
		const m = policies.setMode({ projectId, mode });
		res.status(200).json({ projectId, mode: m.name, capabilities: m.allow });
	} catch (error) {
		res.status(400).json({ error: error?.message || "failed to set mode" });
	}
});

app.get("/engine/mode/current", (req, res) => {
	const projectId = req.query.projectId;
	const m = policies.getMode(projectId);
	res.status(200).json({ projectId: projectId || null, mode: m.name, capabilities: m.allow });
});

app.listen(PORT, () => {
	console.log("──────────────────────────────────────────────");
	console.log(`Cofounder headless engine (standalone)`);
	console.log(`→ listening on port ${PORT}`);
	console.log(`→ env loaded from engine/.env (if present)`);
	console.log("──────────────────────────────────────────────");
});
