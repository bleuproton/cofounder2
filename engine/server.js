import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { fileURLToPath } from "url";
import cofounder from "../api/build.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local engine env first, then fall back to api/.env if present.
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", "api", ".env"), override: false });

const ENGINE_PORT = process.env.ENGINE_PORT || 4300;
const ENGINE_STATE_ROOT = path.resolve(
	__dirname,
	process.env.ENGINE_STATE_ROOT || "../api/db/projects",
);
const ENGINE_EXPORT_ROOT = path.resolve(
	__dirname,
	process.env.ENGINE_EXPORT_APPS_ROOT || "../apps",
);

// Default runtime toggles so the generator writes to disk when running headless.
if (!process.env.STATE_LOCAL) process.env.STATE_LOCAL = "true";
if (!process.env.EXPORT_APPS_ROOT) process.env.EXPORT_APPS_ROOT = ENGINE_EXPORT_ROOT;

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// No-op stream hooks to keep node functions happy without sockets/UI.
const streams = {
	start: async () => {},
	write: async () => {},
	end: async () => {},
	update: async () => {},
};

const seqProjectV1Dag = [
	[],
	["pm.prd"],
	["pm.frd"],
	["pm.frd", "pm.uxsmd"],
	["db.schemas", "uxsitemap.structure"],
	["db.postgres"],
	["pm.brd"],
	["backend.specifications.openapi", "backend.specifications.asyncapi"],
	["backend.server.main"],
	["pm.uxdmd"],
	["uxdatamap.structure"],
	["uxdatamap.views"],
	["webapp.react.store.redux"],
	["webapp.react.root.app"],
	["webapp.react.app.views"],
];

function slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w\-]+/g, "")
		.replace(/\-\-+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "");
}

function ensureStateRoot() {
	if (!fs.existsSync(ENGINE_STATE_ROOT)) {
		fs.mkdirSync(ENGINE_STATE_ROOT, { recursive: true });
	}
}

function readYamlFile(filePath) {
	try {
		return yaml.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		return null;
	}
}

function readProjectState(project) {
	const base = path.join(ENGINE_STATE_ROOT, project, "state");
	const entries = [];
	if (!fs.existsSync(base)) {
		throw new Error("project not found");
	}

	function walk(dir) {
		const list = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of list) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.isFile() && entry.name.endsWith(".yaml")) {
				const parsed = readYamlFile(full);
				if (parsed?.key !== undefined && parsed?.data !== undefined) {
					entries.push({ key: parsed.key, data: parsed.data });
				}
			}
		}
	}

	walk(base);

	const state = {};
	const keymap = {};

	for (const { key, data } of entries) {
		keymap[key] = data;
		const parts = key.split(".");
		let current = state;
		parts.forEach((part, idx) => {
			if (idx === parts.length - 1) {
				if (
					current[part] &&
					typeof current[part] === "object" &&
					typeof data === "object"
				) {
					current[part] = { ...current[part], ...data };
				} else {
					current[part] = data;
				}
			} else {
				if (!current[part] || typeof current[part] !== "object") {
					current[part] = {};
				}
				current = current[part];
			}
		});
	}

	return { state, keymap };
}

function computeResumeIndex(projectKeys = []) {
	let previousPhaseIndex = -1;
	for (const step of seqProjectV1Dag) {
		previousPhaseIndex++;
		if (step.length) {
			const done = step.every((entry) =>
				projectKeys.some((key) => key.startsWith(entry)),
			);
			if (!done) break;
		}
	}
	return previousPhaseIndex;
}

function projectDetails(project) {
	const detailsPath = path.join(
		ENGINE_STATE_ROOT,
		project,
		"state/pm/user/details.yaml",
	);
	const parsed = readYamlFile(detailsPath);
	return parsed?.data || null;
}

function listProjects() {
	ensureStateRoot();
	return fs
		.readdirSync(ENGINE_STATE_ROOT, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => ({
			id: entry.name,
			data: projectDetails(entry.name),
		}));
}

function buildInitQuery({ project, description, aesthetics, timestamp }) {
	return {
		pm: {
			details: {
				text: `${project !== `project-${timestamp}` ? "Project '" + project + "' :\n" : ""}${description}`,
				attachments: [],
				design: {
					aesthetics: {
						text: aesthetics || false,
					},
				},
				timestamp,
			},
		},
	};
}

app.get("/health", (_req, res) => {
	res.status(200).json({
		status: "ok",
		engine: "cofounder-headless",
		port: ENGINE_PORT,
		stateRoot: ENGINE_STATE_ROOT,
		exportRoot: process.env.EXPORT_APPS_ROOT,
		hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
		hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
	});
});

app.get("/v1/projects", (_req, res) => {
	try {
		const projects = listProjects();
		res.status(200).json({ projects });
	} catch (error) {
		res.status(500).json({ error: error.message || "failed to list projects" });
	}
});

app.get("/v1/projects/:project/state", (req, res) => {
	try {
		const { project } = req.params;
		const state = readProjectState(project);
		res.status(200).json(state);
	} catch (error) {
		const status = error.message === "project not found" ? 404 : 500;
		res.status(status).json({ error: error.message || "failed to read state" });
	}
});

app.post("/v1/projects", async (req, res) => {
	try {
		const timestamp = Date.now();
		const { description, aesthetics } = req.body || {};
		let { project } = req.body || {};

		if (!description || !description.length) {
			return res.status(400).json({ error: "description is required" });
		}

		project =
			!project || !slugify(project).length || !slugify(project).match(/[a-z0-9]/)
				? `project-${timestamp}`
				: slugify(project);

		ensureStateRoot();

		const query = buildInitQuery({
			project,
			description,
			aesthetics,
			timestamp,
		});

		// Fire-and-forget to keep the API snappy; engine writes state to disk.
		cofounder.system
			.run({
				id: "seq:project:init:v1",
				context: { project, streams },
				data: query,
			})
			.catch((error) => {
				console.error("[engine] project init error", error);
			});

		res.status(202).json({
			project,
			started: true,
			statePath: path.join(ENGINE_STATE_ROOT, project),
			exportPath: path.join(process.env.EXPORT_APPS_ROOT, project),
		});
	} catch (error) {
		console.error("[engine] init error", error);
		res.status(500).json({ error: "failed to start project generation" });
	}
});

app.post("/v1/projects/:project/resume", async (req, res) => {
	try {
		const { project } = req.params;
		const projectState = readProjectState(project);
		const projectKeys = Object.keys(projectState.keymap || {});
		const resume = computeResumeIndex(projectKeys);

		cofounder.system
			.run({
				id: "seq:project:init:v1",
				context: { project, streams, sequence: { resume } },
				data: projectState.state,
			})
			.catch((error) => {
				console.error("[engine] resume error", error);
			});

		res.status(202).json({ project, resumeFrom: resume });
	} catch (error) {
		console.error("[engine] resume error", error);
		const status = error.message === "project not found" ? 404 : 500;
		res.status(status).json({ error: error.message || "failed to resume project" });
	}
});

app.listen(ENGINE_PORT, () => {
	console.log(
		`> Cofounder headless engine listening on port ${ENGINE_PORT} (state: ${ENGINE_STATE_ROOT})`,
	);
});
