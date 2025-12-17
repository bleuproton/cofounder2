import fs from "fs";
import path from "path";
import nodeNextAdapter from "./nodeNextAdapter.js";
import nodeViteAdapter from "./nodeViteAdapter.js";
import pythonFastapiAdapter from "./pythonFastapiAdapter.js";
import cps from "../structure/cps.js";

const ADAPTERS = [nodeNextAdapter, nodeViteAdapter, pythonFastapiAdapter];

function getAdapter(stack) {
	const adapter = ADAPTERS.find((a) => a.supports(stack));
	if (!adapter) {
		throw new Error(`No adapter for stack: ${stack}`);
	}
	return adapter;
}

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

/**
 * Scaffold all services from a contract into the target root.
 * @param {{projectId: string, contract: any, rootDir?: string}} params
 * @returns {{ paths: string[] }}
 */
export function scaffoldContract({ projectId, contract, rootDir }) {
	if (!contract || !Array.isArray(contract.services)) {
		throw new Error("contract.services is required");
	}
	if (!projectId) {
		throw new Error("projectId is required");
	}

	const exportRoot =
		rootDir ||
		process.env.EXPORT_APPS_ROOT ||
		path.resolve(process.cwd(), "..", "apps");

	// Enforce canonical project structure and manifests
	const { root: projectRoot, servicesRoot } = cps.ensureProjectStructure({
		projectId,
		exportRoot,
		services: contract.services,
	});

	const paths = [];

	for (const service of contract.services) {
		const adapter = getAdapter(service.stack);
		const serviceDir = cps.serviceDir({
			projectId,
			exportRoot,
			serviceName: service.name || service.role || service.stack,
		});
		// ensure manifest exists; cps already wrote it in ensureProjectStructure
		ensureDir(serviceDir);
		adapter.scaffold(service, serviceDir);
		paths.push(serviceDir);
	}

	return { paths, projectRoot, servicesRoot };
}

export default {
	scaffoldContract,
};
