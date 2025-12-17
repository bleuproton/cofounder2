import fs from "fs";
import path from "path";
import cps from "../structure/cps.js";
import diffUtil from "./diff.js";
import policies from "../policies/index.js";

const runs = new Map();

const STRUCTURE_VERSION = cps.STRUCTURE_VERSION;

function normalizeServicePath(projectId, exportRoot, serviceName, targetPath) {
	const allowedRoot = path.join(
		cps.servicesRoot({ projectId, exportRoot }),
		serviceName,
		"src",
	);
	const normalized = path.resolve(allowedRoot, targetPath);
	if (!normalized.startsWith(allowedRoot)) {
		throw new Error(
			`Path violation: ${targetPath} escapes allowed service src (${allowedRoot})`,
		);
	}
	return { allowedRoot, normalized };
}

function validatePaths({ projectId, exportRoot, serviceName, diffText, allowDelete }) {
	const parsed = diffUtil.parseDiff(diffText);
	if (!parsed.length) throw new Error("Empty diff");
	const touched = [];
	for (const filePatch of parsed) {
		// filePatch.to is like a/path or b/path; strip prefixes
		const rawTo = filePatch.to.replace(/^b\//, "").replace(/^a\//, "");
		const rawFrom = filePatch.from?.replace(/^b\//, "").replace(/^a\//, "");
		if (rawTo === "/dev/null") {
			if (!allowDelete) {
				throw new Error("File deletion via /dev/null is not allowed in this mode");
			}
			if (!rawFrom) throw new Error("Deletion missing source path");
			const { allowedRoot, normalized } = normalizeServicePath(
				projectId,
				exportRoot,
				serviceName,
				rawFrom,
			);
			if (!normalized.includes(path.join("services", serviceName, "src"))) {
				throw new Error("All changes must be under services/<service>/src");
			}
			touched.push({ file: normalized, allowedRoot, action: "delete", filePatch });
			continue;
		}
		const { allowedRoot, normalized } = normalizeServicePath(
			projectId,
			exportRoot,
			serviceName,
			rawTo,
		);
		if (!normalized.includes(path.join("services", serviceName, "src"))) {
			throw new Error("All changes must be under services/<service>/src");
		}
		touched.push({ file: normalized, allowedRoot, action: "write", filePatch });
	}
	return { touched, parsed };
}

function recordRun(run) {
	runs.set(run.runId, run);
	return run;
}

function getRun(runId) {
	return runs.get(runId);
}

function runAgentTask({ projectId, service, task, diffText, exportRoot }) {
	if (!projectId) throw new Error("projectId is required");
	if (!service) throw new Error("service is required");
	if (!task) throw new Error("task is required");
	if (!diffText) throw new Error("diffText (unified diff) is required");

	// policy checks
	policies.requireCapability({ projectId, capability: policies.CAPABILITIES.AGENT_RUN });
	policies.requireCapability({
		projectId,
		capability: policies.CAPABILITIES.AGENT_APPLY_DIFF,
	});

	const runId = `run_${Date.now()}`;
	const safeRoot =
		exportRoot ||
		process.env.EXPORT_APPS_ROOT ||
		path.resolve(process.cwd(), "..", "apps");

	// Ensure CPS structure exists (does not let agent change manifests)
	cps.ensureProjectStructure({ projectId, exportRoot: safeRoot, services: [] });

	// Validate paths
	const { touched, parsed } = validatePaths({
		projectId,
		exportRoot: safeRoot,
		serviceName: service,
		diffText,
		allowDelete: policies.can({ projectId, capability: policies.CAPABILITIES.FILE_DELETE }),
	});

	// Per-file capability checks (create/modify/delete)
	for (const t of touched) {
		const exists = fs.existsSync(t.file);
		if (t.action === "delete") {
			policies.requireCapability({
				projectId,
				capability: policies.CAPABILITIES.FILE_DELETE,
			});
		} else if (!exists) {
			policies.requireCapability({
				projectId,
				capability: policies.CAPABILITIES.FILE_CREATE,
			});
		} else {
			policies.requireCapability({
				projectId,
				capability: policies.CAPABILITIES.FILE_MODIFY,
			});
		}
	}

	// Apply (handle deletions separately)
	const applied = [];
	for (const t of touched) {
		if (t.action === "delete") {
			if (fs.existsSync(t.file)) {
				fs.unlinkSync(t.file);
			}
			applied.push(t.file);
		}
	}
	applied.push(
		...diffUtil.applyDiff({
			baseDir: path.join(safeRoot, projectId),
			diffText,
			parsed,
			skipDeletions: true,
		}),
	);

	const run = {
		runId,
		projectId,
		service,
		task,
		status: "completed",
		filesChanged: applied,
		structureVersion: STRUCTURE_VERSION,
		createdAt: new Date().toISOString(),
	};
	return recordRun(run);
}

export default {
	runAgentTask,
	getRun,
};
