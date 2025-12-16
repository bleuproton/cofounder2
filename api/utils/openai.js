import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const buildClient = (overrides = {}) => {
	const apiKey = overrides.apiKey ?? process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.warn("OpenAI client not configured: missing OPENAI_API_KEY");
		return null;
	}
	return new OpenAI({
		apiKey,
		baseURL: overrides.baseURL ?? process.env.OPENAI_BASE_URL ?? undefined,
		organization: overrides.organization ?? process.env.OPENAI_ORG ?? undefined,
	});
};

let openai = buildClient();

const getClient = () => {
	if (!openai) openai = buildClient();
	return openai;
};

const ensureClient = () => {
	const client = getClient();
	if (!client) {
		throw new Error("OpenAI is not configured. Set OPENAI_API_KEY first.");
	}
	return client;
};

const applySettings = ({ apiKey, baseURL, organization } = {}) => {
	openai = buildClient({ apiKey, baseURL, organization });
	return { ok: Boolean(openai) };
};

async function inference({
	model = process.env.OPENAI_MODEL || `gpt-4o-mini`,
	messages,
	stream = process.stdout,
}) {
	const client = ensureClient();
	const streaming = await client.chat.completions.create({
		model,
		messages,
		stream: true,
		stream_options: { include_usage: true },
	});

	let text = "";
	let usage = {};
	let cutoff_reached = false;
	let chunks_buffer = "";
	let chunks_iterator = 0;
	const chunks_every = 5;
	for await (const chunk of streaming) {
		const content = chunk.choices[0]?.delta?.content || "";
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
		if (chunk.usage) usage = { ...chunk.usage };
	}
	stream.write(`\n`);

	return {
		text,
		usage: { model, ...usage },
	};
}
async function vectorize({
	texts,
	model = process.env.EMBEDDING_MODEL || `text-embedding-3-small`,
}) {
	const client = ensureClient();
	const response = await client.embeddings.create({
		model,
		input: texts,
		encoding_format: "float",
	});
	return {
		vectors: response.data
			.sort((a, b) => a.index - b.index)
			.map((e) => e.embedding),
		usage: { model, ...response.usage },
	};
}

async function transcribe({ path }) {
	console.dir({ "debug:utils:openai:transcribe:received": { path } });
	const client = ensureClient();
	const response = await client.audio.transcriptions.create({
		file: fs.createReadStream(path),
		model: "whisper-1",
	});
	console.dir({ "debug:utils:openai:transcribe": { path, response } });
	return {
		transcript: response.text,
	};
}

export default {
	inference,
	vectorize,
	transcribe,
	applySettings,
	getClient,
};
