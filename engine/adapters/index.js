import fs from "fs";
import path from "path";
import nodeNextAdapter from "./nodeNextAdapter.js";
import nodeViteAdapter from "./nodeViteAdapter.js";
import pythonFastapiAdapter from "./pythonFastapiAdapter.js";

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

	const projectRoot = path.resolve(exportRoot, projectId);
	ensureDir(projectRoot);

	const paths = [];

	for (const service of contract.services) {
		const adapter = getAdapter(service.stack);
		const serviceDir = path.join(projectRoot, service.name || service.role || service.stack);
		ensureDir(serviceDir);
		adapter.scaffold(service, serviceDir);
		paths.push(serviceDir);
	}

	return { paths, projectRoot };
}

export default {
	scaffoldContract,
};
