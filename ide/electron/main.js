const path = require("path");
const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const http = require("http");

const ENGINE_PORT = process.env.ENGINE_PORT || 4300;
const ENGINE_HOST = process.env.ENGINE_HOST || "127.0.0.1";
const THEIA_PORT = process.env.THEIA_PORT || 3030;
const THEIA_HOST = process.env.THEIA_HOST || "127.0.0.1";

let engineProcess;
let ideProcess;
let mainWindow;

const isPackaged = app.isPackaged;
const baseDir = isPackaged
	? path.join(process.resourcesPath, "app")
	: path.resolve(__dirname, "..");

const engineDir = isPackaged
	? path.join(process.resourcesPath, "engine")
	: path.resolve(__dirname, "..", "..", "engine");

const theiaDir = isPackaged
	? path.join(process.resourcesPath, "theia-app")
	: path.resolve(__dirname, "packages", "app");

function waitForUrl(url, attempts = 40, delayMs = 250) {
	return new Promise((resolve, reject) => {
		let remaining = attempts;
		const check = () => {
			const req = http.get(url, (res) => {
				res.resume();
				if (res.statusCode && res.statusCode < 500) {
					return resolve(true);
				}
				if (--remaining > 0) return setTimeout(check, delayMs);
				return reject(new Error(`Health check failed (${res.statusCode || "no status"})`));
			});
			req.on("error", () => {
				if (--remaining > 0) return setTimeout(check, delayMs);
				return reject(new Error("Health check failed (unreachable)"));
			});
		};
		check();
	});
}

function spawnNodeProcess(label, entry, args = [], options = {}) {
	const child = spawn(process.execPath, [entry, ...args], {
		stdio: "inherit",
		...options,
	});
	child.on("exit", (code, signal) => {
		console.log(`[${label}] exited`, { code, signal });
	});
	child.on("error", (err) => {
		console.error(`[${label}] failed to start`, err);
	});
	return child;
}

async function ensureEngine() {
	const engineUrl = `http://${ENGINE_HOST}:${ENGINE_PORT}/health`;
	try {
		await waitForUrl(engineUrl, 3, 200);
		console.log("[engine] detected running instance, reusing");
		return;
	} catch {
		console.log("[engine] no existing instance detected, starting bundled engine");
	}

	const entry = path.join(engineDir, "api", "server.js");
	engineProcess = spawnNodeProcess("engine", entry, [], {
		cwd: engineDir,
		env: {
			...process.env,
			ENGINE_PORT,
		},
	});

	try {
		await waitForUrl(engineUrl, 40, 250);
		console.log("[engine] started and healthy");
	} catch (err) {
		dialog.showErrorBox("Cofounder Engine failed to start", err?.message || "Unknown error");
		throw err;
	}
}

async function startTheiaBackend() {
	const theiaUrl = `http://${THEIA_HOST}:${THEIA_PORT}`;

	try {
		await waitForUrl(theiaUrl, 3, 200);
		console.log("[theia] detected running instance, reusing");
		return;
	} catch {
		console.log("[theia] no existing instance detected, starting bundled backend");
	}

	const entry = path.join(theiaDir, "src-gen", "backend", "main.js");
	ideProcess = spawnNodeProcess("theia-backend", entry, ["--port", `${THEIA_PORT}`], {
		cwd: theiaDir,
		env: {
			...process.env,
			// Align Theia defaults with local engine access
			HOSTNAME: THEIA_HOST,
			PORT: THEIA_PORT,
		},
	});

	try {
		await waitForUrl(theiaUrl, 60, 250);
		console.log("[theia] backend started and healthy");
	} catch (err) {
		dialog.showErrorBox("Theia backend failed to start", err?.message || "Unknown error");
		throw err;
	}
}

async function createWindow() {
	await ensureEngine();
	await startTheiaBackend();

	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		backgroundColor: "#0b0b0f",
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
		},
		title: "Cofounder Studio",
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	const frontendUrl = `http://${THEIA_HOST}:${THEIA_PORT}`;
	mainWindow.loadURL(frontendUrl).catch((err) => {
		dialog.showErrorBox("Failed to load Cofounder Studio", err?.message || "Unknown error");
		app.quit();
	});
}

function stopChildProcesses() {
	if (ideProcess && !ideProcess.killed) {
		ideProcess.kill("SIGINT");
		ideProcess = undefined;
	}
	if (engineProcess && !engineProcess.killed) {
		engineProcess.kill("SIGINT");
		engineProcess = undefined;
	}
}

app.on("ready", () => {
	createWindow().catch((err) => {
		console.error("Failed to start Cofounder Studio", err);
		dialog.showErrorBox("Cofounder Studio failed to start", err?.message || "Unknown error");
		app.quit();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow().catch((err) => {
			console.error("Failed to start Cofounder Studio", err);
			dialog.showErrorBox("Cofounder Studio failed to start", err?.message || "Unknown error");
			app.quit();
		});
	}
});

app.on("before-quit", () => {
	stopChildProcesses();
});

process.on("exit", () => {
	stopChildProcesses();
});
