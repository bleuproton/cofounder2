import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, "..", ".env");

const SETTINGS_KEYS = {
	openAiApiKey: "OPENAI_API_KEY",
	openAiBaseUrl: "OPENAI_BASE_URL",
	openAiModel: "OPENAI_MODEL",
	openAiOrg: "OPENAI_ORG",
	anthropicApiKey: "ANTHROPIC_API_KEY",
	anthropicBaseUrl: "ANTHROPIC_BASE_URL",
	anthropicModel: "ANTHROPIC_MODEL",
	cofounderApiKey: "COFOUNDER_API_KEY",
};

function loadEnvFile() {
	if (!fs.existsSync(ENV_PATH)) return {};
	const raw = fs.readFileSync(ENV_PATH, "utf8");
	try {
		return dotenv.parse(raw);
	} catch (error) {
		console.error("Failed to parse .env:", error);
		return {};
	}
}

function writeEnvFile(envObj) {
	const content =
		Object.entries(envObj)
			.map(([key, value]) => `${key}=${value}`)
			.join("\n") + "\n";
	fs.writeFileSync(ENV_PATH, content, "utf8");
}

export function loadApiSettings() {
	const envFile = loadEnvFile();
	const resolved = { ...envFile, ...process.env };
	return {
		openAiBaseUrl: resolved.OPENAI_BASE_URL || "",
		openAiModel: resolved.OPENAI_MODEL || "",
		openAiOrg: resolved.OPENAI_ORG || "",
		anthropicBaseUrl: resolved.ANTHROPIC_BASE_URL || "",
		anthropicModel: resolved.ANTHROPIC_MODEL || "",
		hasOpenAiApiKey: Boolean(resolved.OPENAI_API_KEY),
		hasAnthropicApiKey: Boolean(resolved.ANTHROPIC_API_KEY),
		hasCofounderApiKey: Boolean(resolved.COFOUNDER_API_KEY),
	};
}

export function persistApiSettings(payload = {}) {
	const envFile = loadEnvFile();
	const updates = {};

	Object.entries(SETTINGS_KEYS).forEach(([payloadKey, envKey]) => {
		const value = payload[payloadKey];
		if (typeof value === "string" && value.trim().length) {
			updates[envKey] = value.trim();
		}
	});

	if (!Object.keys(updates).length) {
		throw new Error("No settings provided to persist");
	}

	const merged = { ...envFile, ...updates };
	writeEnvFile(merged);

	Object.entries(updates).forEach(([key, value]) => {
		process.env[key] = value;
	});

	return { saved: updates, env: merged };
}

export { ENV_PATH, SETTINGS_KEYS };
