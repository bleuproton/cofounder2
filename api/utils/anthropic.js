import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const buildClient = (overrides = {}) => {
	const apiKey = overrides.apiKey ?? process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		console.warn("Anthropic client not configured: missing ANTHROPIC_API_KEY");
		return null;
	}
	return new Anthropic({
		apiKey,
		baseURL: overrides.baseURL ?? process.env.ANTHROPIC_BASE_URL ?? undefined,
	});
};

let anthropic = buildClient();

const getClient = () => {
	if (!anthropic) anthropic = buildClient();
	return anthropic;
};

const ensureClient = () => {
	const client = getClient();
	if (!client) {
		throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY first.");
	}
	return client;
};

const applySettings = ({ apiKey, baseURL } = {}) => {
	anthropic = buildClient({ apiKey, baseURL });
	return { ok: Boolean(anthropic) };
};

async function _convertFromOpenaiFormat({ messages }) {
	const newMessages = (
		await Promise.all(
			messages.slice(1).map(async (m) => {
				if (typeof m.content === "string") {
					return [{ type: "text", text: m.content }];
				}
				return (
					await Promise.all(
						m.content.map(async (item) => {
							if (item.type === "text") return item;
							const { url } = item.image_url;
							if (url.includes(";base64,")) {
								return {
									type: "image",
									source: {
										type: "base64",
										media_type: url.split(";base64,")[0].split("data:")[1],
										data: url.split(";base64,")[1],
									},
								};
							}
							if (url.includes("http")) {
								const response = await fetch(url);
								const buffer = await response.arrayBuffer();
								const base64String = Buffer.from(buffer).toString("base64");
								const mediaType = response.headers.get("content-type");
								return {
									type: "image",
									source: {
										type: "base64",
										media_type: mediaType,
										data: base64String,
									},
								};
							}
							return false;
						}),
					)
				).filter((e) => e);
			}),
		)
	)
		.filter((e) => e)
		.flat();

	return {
		system: messages[0].content,
		messages: [
			{
				role: `user`,
				content: newMessages,
			},
		],
	};
}

const normalizeModel = (requested) => {
	if (!requested) return null;
	// Map unsupported aliases to known-good versions.
	if (requested === "claude-3-5-sonnet-latest") {
		return "claude-3-5-sonnet-20241022";
	}
	if (requested === "claude-3-5-opus-latest") {
		return "claude-3-5-opus-20241022";
	}
	return requested;
};

async function inference({
	model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
	messages,
	stream = process.stdout,
}) {
	const client = ensureClient();
	const converted = await _convertFromOpenaiFormat({ messages });

	const fallbackModel =
		normalizeModel(process.env.ANTHROPIC_MODEL) ||
		"claude-3-5-sonnet-20241022";
	const resolveModel = (requested) => {
		const normalized = normalizeModel(requested);
		if (normalized && !normalized.includes("gpt")) return normalized;
		return fallbackModel;
	};

	let chosenModel = resolveModel(model);
	let streaming;
	const maxTokensFor = (m) => {
		if (m.includes("haiku")) return 4096;
		if (m.includes("sonnet")) return 8192;
		if (m.includes("opus")) return 8192;
		return 4096;
	};
	let maxTokens = maxTokensFor(chosenModel);

	try {
		streaming = await client.messages.create({
			model: chosenModel,
			stream: true,
			system: converted.system,
			max_tokens: maxTokens,
			messages: converted.messages,
		});
	} catch (err) {
		const notFound =
			err?.error?.error?.type === "not_found_error" ||
			err?.message?.includes("not_found_error");
		if (notFound && chosenModel !== fallbackModel) {
			chosenModel = fallbackModel;
			maxTokens = maxTokensFor(chosenModel);
			streaming = await client.messages.create({
				model: chosenModel,
				stream: true,
				system: converted.system,
				max_tokens: maxTokens,
				messages: converted.messages,
			});
		} else {
			throw err;
		}
	}

	let text = "";
	let usage = {};
	let cutoff_reached = false;
	let chunks_buffer = "";
	let chunks_iterator = 0;
	const chunks_every = 5;
	for await (const event of streaming) {
		if (
			event.type === "content_block_delta" &&
			event.delta.type === "text_delta"
		) {
			const content = event.delta.text;
			if (content) {
				text += content;
				chunks_buffer += content;
				chunks_iterator++;
				if (stream?.cutoff) {
					if (!cutoff_reached && text.includes(stream.cutoff)) {
						cutoff_reached = true;
					}
				}
				if (!(chunks_iterator % chunks_every)) {
					stream.write(!cutoff_reached ? chunks_buffer : " ...");
					chunks_buffer = "";
				}
			}
		}
	}
	stream.write("\n");

	return {
		text,
		usage: { model: chosenModel, ...usage },
	};
}

export default {
	inference,
	applySettings,
	getClient,
};
