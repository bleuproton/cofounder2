import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { decideArchitecture } from "../architecture/decider.js";

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
			.json({ error: error?.message || "failed to run architecture decision" });
	}
});

app.listen(PORT, () => {
	console.log("──────────────────────────────────────────────");
	console.log(`Cofounder headless engine (standalone)`);
	console.log(`→ listening on port ${PORT}`);
	console.log(`→ env loaded from engine/.env (if present)`);
	console.log("──────────────────────────────────────────────");
});
