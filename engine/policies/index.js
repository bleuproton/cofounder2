const CAPABILITIES = {
	AGENT_RUN: "agent.run",
	AGENT_APPLY_DIFF: "agent.applyDiff",
	SANDBOX_START: "sandbox.start",
	SANDBOX_STOP: "sandbox.stop",
	FILE_MODIFY: "file.modify",
	FILE_CREATE: "file.create",
	FILE_DELETE: "file.delete",
	SERVICE_RUN: "service.run",
};

const MODES = {
	guided: {
		name: "guided",
		allow: {
			[CAPABILITIES.AGENT_RUN]: true,
			[CAPABILITIES.AGENT_APPLY_DIFF]: true,
			[CAPABILITIES.SANDBOX_START]: true, // single service implied by higher-level orchestration
			[CAPABILITIES.SANDBOX_STOP]: true,
			[CAPABILITIES.FILE_MODIFY]: true,
			[CAPABILITIES.FILE_CREATE]: true,
			[CAPABILITIES.FILE_DELETE]: false,
			[CAPABILITIES.SERVICE_RUN]: true,
		},
	},
	builder: {
		name: "builder",
		allow: {
			[CAPABILITIES.AGENT_RUN]: true,
			[CAPABILITIES.AGENT_APPLY_DIFF]: true,
			[CAPABILITIES.SANDBOX_START]: true,
			[CAPABILITIES.SANDBOX_STOP]: true,
			[CAPABILITIES.FILE_MODIFY]: true,
			[CAPABILITIES.FILE_CREATE]: true,
			[CAPABILITIES.FILE_DELETE]: false,
			[CAPABILITIES.SERVICE_RUN]: true,
		},
	},
	developer: {
		name: "developer",
		allow: {
			[CAPABILITIES.AGENT_RUN]: true,
			[CAPABILITIES.AGENT_APPLY_DIFF]: true,
			[CAPABILITIES.SANDBOX_START]: true,
			[CAPABILITIES.SANDBOX_STOP]: true,
			[CAPABILITIES.FILE_MODIFY]: true,
			[CAPABILITIES.FILE_CREATE]: true,
			[CAPABILITIES.FILE_DELETE]: true, // still scoped to src via CPS
			[CAPABILITIES.SERVICE_RUN]: true,
		},
	},
};

const projectModes = new Map(); // projectId -> mode name

function getMode(projectId) {
	if (!projectId) return MODES.guided;
	const modeName = projectModes.get(projectId) || "guided";
	return MODES[modeName] || MODES.guided;
}

function setMode({ projectId, mode }) {
	if (!projectId) throw new Error("projectId is required");
	if (!mode || !MODES[mode]) throw new Error(`Unknown mode: ${mode}`);
	projectModes.set(projectId, mode);
	return getMode(projectId);
}

function requireCapability({ projectId, capability }) {
	const mode = getMode(projectId);
	if (!mode.allow[capability]) {
		throw new Error(
			`Capability '${capability}' is not allowed in mode '${mode.name}'. Change mode or reduce scope.`,
		);
	}
	return true;
}

function can({ projectId, capability }) {
	const mode = getMode(projectId);
	return Boolean(mode.allow[capability]);
}

export default {
	CAPABILITIES,
	MODES,
	getMode,
	setMode,
	requireCapability,
	can,
};
