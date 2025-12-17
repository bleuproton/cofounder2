import * as React from "react";
import { injectable } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser";

type ModeResponse = {
	mode: string;
	capabilities: Record<string, boolean>;
	projectId?: string | null;
};

type RunResult = {
	runId?: string;
	status?: string;
	error?: string;
	filesChanged?: string[];
};

@injectable()
export class CofounderWidget extends ReactWidget {
	static readonly ID = "cofounder-widget";

	state = {
		projectId: "",
		mode: "guided",
		capabilities: {} as Record<string, boolean>,
		task: "",
		service: "",
		diff: "",
		runResult: null as RunResult | null,
		sandboxStatus: "",
		log: "",
	};

	constructor() {
		super();
		this.id = CofounderWidget.ID;
		this.title.label = "Cofounder";
		this.title.closable = true;
		this.update();
	}

	private engineBase() {
		return process.env.COF_FOUNDER_ENGINE_BASE || "http://localhost:4300";
	}

	private async fetchMode(projectId?: string) {
		const url = new URL("/engine/mode/current", this.engineBase());
		if (projectId) url.searchParams.set("projectId", projectId);
		const res = await fetch(url.toString());
		if (!res.ok) throw new Error(await res.text());
		return res.json() as Promise<ModeResponse>;
	}

	private async runAgent() {
		const { projectId, service, task, diff } = this.state as any;
		const res = await fetch(`${this.engineBase()}/engine/agents/run`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ projectId, service, task, diff }),
		});
		if (!res.ok) throw new Error(await res.text());
		const json = await res.json();
		this.setState({ runResult: json, log: JSON.stringify(json, null, 2) });
	}

	private async sandbox(action: "start" | "stop") {
		const { projectId, service } = this.state as any;
		const endpoint =
			action === "start"
				? "/engine/sandbox/start"
				: "/engine/sandbox/stop";
		const res = await fetch(`${this.engineBase()}${endpoint}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ projectId, service }),
		});
		if (!res.ok) throw new Error(await res.text());
		const json = await res.json();
		this.setState({ sandboxStatus: JSON.stringify(json) });
	}

	componentDidMount(): void {
		this.refreshMode().catch((e) => {
			this.setState({ log: String(e) });
		});
	}

	private async refreshMode() {
		const { projectId } = this.state as any;
		const resp = await this.fetchMode(projectId);
		this.setState({
			mode: resp.mode,
			capabilities: resp.capabilities || {},
			projectId: resp.projectId || projectId,
		});
	}

	protected render(): React.ReactNode {
		const { mode, capabilities, runResult, sandboxStatus, log } = this.state as any;

		const guided = mode === "guided";

		return (
			<div style={{ padding: 12, fontFamily: "sans-serif" }}>
				<h2>Cofounder Studio</h2>
				<section>
					<h4>Mode</h4>
					<div>Current: <strong>{mode}</strong></div>
					<pre style={{ background: "#111", color: "#eee", padding: 8, maxHeight: 150, overflow: "auto" }}>
						{JSON.stringify(capabilities, null, 2)}
					</pre>
					<button onClick={() => this.refreshMode()}>Refresh mode</button>
				</section>

				<section style={{ marginTop: 16 }}>
					<h4>Agent</h4>
					<div>
						<input
							placeholder="Project ID"
							value={this.state.projectId}
							onChange={(e) => this.setState({ projectId: e.target.value })}
						/>
						<input
							placeholder="Service"
							value={this.state.service}
							onChange={(e) => this.setState({ service: e.target.value })}
						/>
					</div>
					<textarea
						placeholder="Task"
						value={this.state.task}
						onChange={(e) => this.setState({ task: e.target.value })}
						style={{ width: "100%", height: 60, marginTop: 8 }}
					/>
					<textarea
						placeholder="Unified diff (must target services/<service>/src)"
						value={this.state.diff}
						onChange={(e) => this.setState({ diff: e.target.value })}
						style={{ width: "100%", height: 140, marginTop: 8 }}
					/>
					<button
						onClick={() => this.runAgent().catch((e) => this.setState({ log: String(e) }))}
						disabled={guided && !capabilities["agent.applyDiff"]}
					>
						Run agent
					</button>
					{runResult && (
						<pre style={{ background: "#111", color: "#eee", padding: 8, marginTop: 8 }}>
							{JSON.stringify(runResult, null, 2)}
						</pre>
					)}
				</section>

				<section style={{ marginTop: 16 }}>
					<h4>Sandbox</h4>
					<button
						onClick={() => this.sandbox("start").catch((e) => this.setState({ log: String(e) }))}
						disabled={guided && !capabilities["sandbox.start"]}
					>
						Start service
					</button>
					<button
						onClick={() => this.sandbox("stop").catch((e) => this.setState({ log: String(e) }))}
						style={{ marginLeft: 8 }}
					>
						Stop service
					</button>
					{sandboxStatus && (
						<pre style={{ background: "#111", color: "#eee", padding: 8, marginTop: 8 }}>
							{sandboxStatus}
						</pre>
					)}
				</section>

				<section style={{ marginTop: 16 }}>
					<h4>Logs / Results</h4>
					<pre style={{ background: "#111", color: "#eee", padding: 8, minHeight: 80 }}>
						{log}
					</pre>
				</section>
			</div>
		);
	}
}
