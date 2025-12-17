const SUPPORTED_STACKS = ["node-nextjs", "node-vite", "python-fastapi"];

const STACK_PROFILES = {
	"node-nextjs": {
		language: "typescript",
		commands: {
			install: "npm install",
			dev: "npm run dev",
			build: "npm run build",
		},
		port: 3000,
	},
	"node-vite": {
		language: "typescript",
		commands: {
			install: "npm install",
			dev: "npm run dev",
			build: "npm run build",
		},
		port: 5173,
	},
	"python-fastapi": {
		language: "python",
		commands: {
			install: "pip install -r requirements.txt",
			dev: "uvicorn app:app --reload --port 8000",
			build: "echo 'no build step for fastapi (runtime start)'",
		},
		port: 8000,
	},
};

function validateDecision(decision) {
	if (!decision) throw new Error("decision is required");
	const { frontendStack, backendStack } = decision;
	if (!SUPPORTED_STACKS.includes(frontendStack)) {
		throw new Error(
			`unsupported frontendStack: ${frontendStack}; supported: ${SUPPORTED_STACKS.join(", ")}`,
		);
	}
	if (!SUPPORTED_STACKS.includes(backendStack)) {
		throw new Error(
			`unsupported backendStack: ${backendStack}; supported: ${SUPPORTED_STACKS.join(", ")}`,
		);
	}
}

export function generateProjectContract(decision) {
	validateDecision(decision);
	const { frontendStack, backendStack } = decision;

	const services = [];

	const frontendProfile = STACK_PROFILES[frontendStack];
	services.push({
		name: "frontend",
		role: "ui",
		stack: frontendStack,
		language: frontendProfile.language,
		port: frontendProfile.port,
		commands: frontendProfile.commands,
		dependsOn: ["backend"],
	});

	const backendProfile = STACK_PROFILES[backendStack];
	services.push({
		name: "backend",
		role: "api",
		stack: backendStack,
		language: backendProfile.language,
		port: backendProfile.port,
		commands: backendProfile.commands,
		dependsOn: [],
	});

	return {
		id: `contract-${Date.now()}`,
		services,
		stacks: {
			frontend: frontendStack,
			backend: backendStack,
		},
		languages: [
			...new Set([frontendProfile.language, backendProfile.language]),
		],
		commands: {
			frontend: frontendProfile.commands,
			backend: backendProfile.commands,
		},
		ports: {
			frontend: frontendProfile.port,
			backend: backendProfile.port,
		},
		relationships: [
			{ from: "frontend", to: "backend", type: "depends_on" },
		],
	};
}
