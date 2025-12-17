import dotenv from "dotenv";
dotenv.config();

const ENGINE_API_BASE_URL =
	process.env.ENGINE_API_BASE_URL || "http://localhost:4300";

async function createProject({ intent, name }) {
	const url = `${ENGINE_API_BASE_URL}/engine/projects`;
	const payload = { intent, name };
	const resp = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!resp.ok) {
		const text = await resp.text();
		throw new Error(
			`engine createProject failed: ${resp.status} ${resp.statusText} ${text}`,
		);
	}
	return resp.json();
}

export default {
	createProject,
	baseUrl: ENGINE_API_BASE_URL,
};
