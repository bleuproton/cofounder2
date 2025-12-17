const FRONTEND_STACKS = ["node-nextjs", "node-vite"];
const BACKEND_STACKS = ["python-fastapi", "node-nextjs"];

const KEYWORDS = {
	seo: ["seo", "search", "marketing", "landing", "public site", "blog", "ssr"],
	dashboard: ["dashboard", "analytics", "admin", "backoffice"],
	auth: ["auth", "authentication", "login", "signup", "account"],
	realtime: ["realtime", "real-time", "live", "websocket", "notifications"],
	ai: ["ai", "ml", "llm", "model", "chatbot", "assistant"],
	api: ["api", "apis", "integrations", "backend"],
	perf: ["fast", "performant", "responsive", "snappy"],
};

function matchSignals(intent) {
	const normalized = intent.toLowerCase();
	const hits = {};
	for (const [key, words] of Object.entries(KEYWORDS)) {
		hits[key] = words.some((w) => normalized.includes(w));
	}
	return hits;
}

function analyzeIntent(intent) {
	const signals = matchSignals(intent);
	const findings = [];
	if (signals.seo) findings.push("SEO/marketing language detected");
	if (signals.dashboard) findings.push("Dashboard/analytics mentioned");
	if (signals.auth) findings.push("Authentication requirements mentioned");
	if (signals.realtime) findings.push("Realtime/live features mentioned");
	if (signals.ai) findings.push("AI/LLM needs mentioned");
	if (signals.api) findings.push("API/integration focus mentioned");

	return {
		signals,
		findings,
	};
}

function selectFrontend({ signals }) {
	if (signals.seo) {
		return {
			stack: "node-nextjs",
			reason:
				"SEO or marketing context benefits from server-side rendering and routing (Next.js).",
			score: 0.25,
		};
	}
	if (signals.dashboard || signals.auth) {
		return {
			stack: "node-nextjs",
			reason:
				"Dashboards/auth flows benefit from built-in routing and middleware in Next.js.",
			score: 0.2,
		};
	}
	return {
		stack: "node-vite",
		reason: "Default to lightweight SPA when no SSR/SEO signals are present.",
		score: 0.15,
	};
}

function selectBackend({ signals }) {
	if (signals.ai) {
		return {
			stack: "python-fastapi",
			reason: "AI/LLM workloads are well-served by Python/FastAPI.",
			score: 0.25,
		};
	}
	if (signals.api) {
		return {
			stack: "python-fastapi",
			reason: "API-centric projects align with FastAPI's async-first design.",
			score: 0.2,
		};
	}
	if (signals.realtime) {
		return {
			stack: "node-nextjs",
			reason: "Realtime hints favor Node runtimes and shared JS across stack.",
			score: 0.18,
		};
	}
	// Default backend choice pairs with frontend default
	return {
		stack: "node-nextjs",
		reason: "Default to a cohesive JS stack when no strong backend signal is present.",
		score: 0.12,
	};
}

function computeConfidence(frontendScore, backendScore, findingsCount) {
	const base = 0.5;
	const signalBoost = Math.min(findingsCount * 0.05, 0.2);
	const stackBoost = frontendScore + backendScore;
	return Math.min(1, base + signalBoost + stackBoost);
}

export function decideArchitecture(intent) {
	const trimmed = intent?.trim();
	if (!trimmed) {
		throw new Error("intent is required");
	}

	const analysis = analyzeIntent(trimmed);
	const frontend = selectFrontend({ signals: analysis.signals });
	const backend = selectBackend({ signals: analysis.signals });
	const confidence = computeConfidence(
		frontend.score,
		backend.score,
		analysis.findings.length,
	);

	const reasoning = [
		...analysis.findings.map((f) => f),
		frontend.reason,
		backend.reason,
	];

	return {
		id: `ade-${Date.now()}`,
		frontendStack: frontend.stack,
		backendStack: backend.stack,
		reasoning,
		confidence,
	};
}
