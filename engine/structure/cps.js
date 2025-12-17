import fs from "fs";
import path from "path";

const STRUCTURE_VERSION = "1.0";
const SERVICES_DIRNAME = "services";
const MANIFEST_FILENAME = "cofounder.json";
const SERVICE_MANIFEST_FILENAME = "service.json";

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function assertWithin(base, target) {
	const normBase = path.resolve(base);
	const normTarget = path.resolve(target);
	if (!normTarget.startsWith(normBase)) {
		throw new Error(`Path violation: ${normTarget} is outside allowed root ${normBase}`);
	}
}

function projectRoot({ projectId, exportRoot }) {
	const root = path.resolve(exportRoot, projectId);
	return root;
}

function servicesRoot({ projectId, exportRoot }) {
	return path.join(projectRoot({ projectId, exportRoot }), SERVICES_DIRNAME);
}

function ensureProjectManifest({ projectId, exportRoot }) {
	const root = projectRoot({ projectId, exportRoot });
	const manifestPath = path.join(root, MANIFEST_FILENAME);
	ensureDir(root);
	if (!fs.existsSync(manifestPath)) {
		const manifest = {
			structureVersion: STRUCTURE_VERSION,
			projectId,
			createdAt: new Date().toISOString(),
		};
		fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
	}
	return manifestPath;
}

function ensureServiceManifest({ projectId, exportRoot, service }) {
	const svcDir = serviceDir({ projectId, exportRoot, serviceName: service.name || service.role || service.stack });
	const manifestPath = path.join(svcDir, SERVICE_MANIFEST_FILENAME);
	ensureDir(svcDir);
	const manifest = {
		structureVersion: STRUCTURE_VERSION,
		projectId,
		service: {
			name: service.name || service.role || service.stack,
			stack: service.stack,
			role: service.role || null,
			port: service.port || null,
		},
		createdAt: new Date().toISOString(),
	};
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
	return manifestPath;
}

function serviceDir({ projectId, exportRoot, serviceName }) {
	const root = servicesRoot({ projectId, exportRoot });
	const dir = path.join(root, serviceName);
	assertWithin(root, dir);
	return dir;
}

function ensureProjectStructure({ projectId, exportRoot, services }) {
	if (!projectId) throw new Error("projectId is required");
	if (!exportRoot) throw new Error("exportRoot is required");
	const root = projectRoot({ projectId, exportRoot });
	const svcRoot = servicesRoot({ projectId, exportRoot });
	assertWithin(exportRoot, root);
	ensureDir(root);
	ensureDir(svcRoot);
	ensureProjectManifest({ projectId, exportRoot });
	if (services?.length) {
		for (const service of services) {
			if (!service?.stack) throw new Error("service.stack is required");
			const dir = serviceDir({
				projectId,
				exportRoot,
				serviceName: service.name || service.role || service.stack,
			});
			ensureDir(dir);
			ensureServiceManifest({ projectId, exportRoot, service });
		}
	}
	return { root, servicesRoot: svcRoot };
}

export default {
	STRUCTURE_VERSION,
	SERVICES_DIRNAME,
	projectRoot,
	servicesRoot,
	serviceDir,
	ensureProjectStructure,
	ensureProjectManifest,
	ensureServiceManifest,
};
