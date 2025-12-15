import React, { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	BoltIcon,
	ShieldCheckIcon,
	SignalIcon,
	ClockIcon,
} from "@heroicons/react/24/outline";

type ProjectBudget = {
	name: string;
	limit: number;
	spent: number;
	tokensIn: number;
	tokensOut: number;
	runs: number;
	avgRuntime: string;
	concurrencyLimit: number;
	lastRun: string;
};

type RunLog = {
	id: string;
	project: string;
	started: string;
	duration: string;
	totalCost: number;
	inputTokens: number;
	outputTokens: number;
	model: string;
	concurrencyUsed: number;
	status: "ok" | "warn" | "stopped";
	nodes: {
		name: string;
		model: string;
		inputTokens: number;
		outputTokens: number;
		cost: number;
		runtime: string;
		status: "ok" | "warn" | "cut";
	}[];
};

const Settings: React.FC = () => {
	const [workspaceBudget, setWorkspaceBudget] = useState<number>(600);
	const [defaultProjectCap, setDefaultProjectCap] = useState<number>(150);
	const [runHardCap, setRunHardCap] = useState<number>(18);
	const [concurrencyLimit, setConcurrencyLimit] = useState<number>(4);
	const [queueDepth, setQueueDepth] = useState<number>(12);
	const [loggingEnabled, setLoggingEnabled] = useState<boolean>(true);
	const [alertingEnabled, setAlertingEnabled] = useState<boolean>(true);
	const [killSwitchEnabled, setKillSwitchEnabled] = useState<boolean>(true);

	const projectBudgets = useMemo<ProjectBudget[]>(
		() => [
			{
				name: "AdvisorGPT",
				limit: 240,
				spent: 148,
				tokensIn: 198_400,
				tokensOut: 132_100,
				runs: 42,
				avgRuntime: "42s",
				concurrencyLimit: 3,
				lastRun: "4m ago",
			},
			{
				name: "DataSynth QA",
				limit: 150,
				spent: 91,
				tokensIn: 122_300,
				tokensOut: 98_200,
				runs: 27,
				avgRuntime: "58s",
				concurrencyLimit: 2,
				lastRun: "13m ago",
			},
			{
				name: "ResearchOps",
				limit: 120,
				spent: 44,
				tokensIn: 80_200,
				tokensOut: 60_400,
				runs: 19,
				avgRuntime: "37s",
				concurrencyLimit: 1,
				lastRun: "32m ago",
			},
		],
		[],
	);

	const runHistory = useMemo<RunLog[]>(
		() => [
			{
				id: "run-2481",
				project: "AdvisorGPT",
				started: "4m ago",
				duration: "1m 12s",
				totalCost: 1.82,
				inputTokens: 8_200,
				outputTokens: 6_230,
				model: "gpt-4o-mini",
				concurrencyUsed: 2,
				status: "ok",
				nodes: [
					{
						name: "classify-intent",
						model: "gpt-4o-mini",
						inputTokens: 1_200,
						outputTokens: 320,
						cost: 0.12,
						runtime: "8s",
						status: "ok",
					},
					{
						name: "plan-orchestration",
						model: "gpt-4o",
						inputTokens: 2_600,
						outputTokens: 1_100,
						cost: 0.36,
						runtime: "18s",
						status: "ok",
					},
					{
						name: "synthesise-answer",
						model: "gpt-4o-mini",
						inputTokens: 4_400,
						outputTokens: 4_810,
						cost: 1.34,
						runtime: "46s",
						status: "ok",
					},
				],
			},
			{
				id: "run-2479",
				project: "DataSynth QA",
				started: "22m ago",
				duration: "2m 04s",
				totalCost: 14.1,
				inputTokens: 12_400,
				outputTokens: 10_050,
				model: "gpt-4o",
				concurrencyUsed: 3,
				status: "warn",
				nodes: [
					{
						name: "pre-flight-sanitizer",
						model: "gpt-4o-mini",
						inputTokens: 900,
						outputTokens: 240,
						cost: 0.08,
						runtime: "6s",
						status: "ok",
					},
					{
						name: "multi-doc-grounding",
						model: "gpt-4o",
						inputTokens: 6_700,
						outputTokens: 4_200,
						cost: 4.92,
						runtime: "58s",
						status: "warn",
					},
					{
						name: "fact-checker",
						model: "gpt-4o",
						inputTokens: 4_800,
						outputTokens: 5_610,
						cost: 9.1,
						runtime: "60s",
						status: "warn",
					},
				],
			},
			{
				id: "run-2476",
				project: "ResearchOps",
				started: "1h ago",
				duration: "54s",
				totalCost: 17.9,
				inputTokens: 15_200,
				outputTokens: 8_700,
				model: "gpt-4o",
				concurrencyUsed: 1,
				status: "stopped",
				nodes: [
					{
						name: "search-summarise",
						model: "gpt-4o-mini",
						inputTokens: 2_200,
						outputTokens: 1_240,
						cost: 0.18,
						runtime: "9s",
						status: "ok",
					},
					{
						name: "analysis-core",
						model: "gpt-4o",
						inputTokens: 13_000,
						outputTokens: 7_460,
						cost: 17.7,
						runtime: "45s",
						status: "cut",
					},
				],
			},
		],
		[],
	);

	const totals = useMemo(
		() =>
			projectBudgets.reduce(
				(acc, project) => {
					acc.spent += project.spent;
					acc.tokensIn += project.tokensIn;
					acc.tokensOut += project.tokensOut;
					return acc;
				},
				{ spent: 0, tokensIn: 0, tokensOut: 0 },
			),
		[projectBudgets],
	);

	const formatUsd = (value: number) => `$${value.toFixed(2)}`;
	const formatTokens = (value: number) =>
		value.toLocaleString("en-US", { maximumFractionDigits: 0 });

	const budgetProgress = Math.min(
		100,
		workspaceBudget ? (totals.spent / workspaceBudget) * 100 : 0,
	);

	return (
		<div className="relative min-h-screen w-full text-white overflow-hidden">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(90,90,90,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(120,120,120,0.16),transparent_30%),linear-gradient(120deg,rgba(18,18,18,0.7),rgba(10,10,10,0.9))]" />
			<div className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-10">
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-3">
						<Badge className="bg-white/10 text-white border border-white/10">
							Token & Cost Control
						</Badge>
						<span className="text-sm text-[#b5b5b5]">
							Each LLM node logs input/output tokens, model, costs, and runtime.
						</span>
					</div>
					<div className="flex flex-wrap items-end justify-between gap-3">
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">
								Centralized cost guardrails per project, run, and node
							</h1>
							<p className="text-[#c5c5c5] max-w-3xl leading-relaxed mt-2">
								Logs are stored centrally so you have real-time visibility into
								token usage, models, and runtime. Hard budgets and concurrency
								limits prevent runaway jobs and surprise invoices.
							</p>
						</div>
						<Button variant="secondary" className="font-normal">
							Export ledger
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card className="bg-[#0f0f0f]/80 border-[#222] backdrop-blur">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<ShieldCheckIcon className="w-4 h-4" />
								Hard limits
							</CardTitle>
							<Badge className="bg-green-500/20 border border-green-500/30 text-green-200">
								always-on
							</Badge>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-[#d7d7d7]">
							<div className="grid grid-cols-1 gap-3">
								<div className="space-y-1">
									<label className="text-xs uppercase tracking-wide text-[#999]">
										Workspace monthly budget (USD)
									</label>
									<Input
										type="number"
										value={workspaceBudget}
										onChange={(e) =>
											setWorkspaceBudget(Number(e.target.value) || 0)
										}
										className="bg-[#151515] border-[#2d2d2d] text-white"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs uppercase tracking-wide text-[#999]">
										Default project limit (USD)
									</label>
									<Input
										type="number"
										value={defaultProjectCap}
										onChange={(e) =>
											setDefaultProjectCap(Number(e.target.value) || 0)
										}
										className="bg-[#151515] border-[#2d2d2d] text-white"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs uppercase tracking-wide text-[#999]">
										Hard stop per run (USD)
									</label>
									<Input
										type="number"
										value={runHardCap}
										onChange={(e) => setRunHardCap(Number(e.target.value) || 0)}
										className="bg-[#151515] border-[#2d2d2d] text-white"
									/>
								</div>
							</div>
							<div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e]">
								<div>
									<p className="text-sm font-semibold">Kill-switch</p>
									<p className="text-xs text-[#a9a9a9]">
										Stop nodes once a run exceeds {formatUsd(runHardCap)}.
									</p>
								</div>
								<Switch
									checked={killSwitchEnabled}
									onCheckedChange={setKillSwitchEnabled}
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-[#0f0f0f]/80 border-[#222] backdrop-blur">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<SignalIcon className="w-4 h-4" />
								Concurrency & queue
							</CardTitle>
							<Badge className="bg-blue-500/20 border border-blue-500/30 text-blue-200">
								guardrail
							</Badge>
						</CardHeader>
						<CardContent className="space-y-5 text-sm text-[#d7d7d7]">
							<div className="space-y-2">
								<div className="flex justify-between text-xs text-[#a9a9a9]">
									<span>Max parallel LLM nodes</span>
									<span className="text-white font-semibold">
										{concurrencyLimit} nodes
									</span>
								</div>
								<Slider
									value={[concurrencyLimit]}
									min={1}
									max={12}
									step={1}
									onValueChange={(value) => setConcurrencyLimit(value[0])}
								/>
							</div>
							<div className="space-y-2">
								<div className="flex justify-between text-xs text-[#a9a9a9]">
									<span>Queue depth</span>
									<span className="text-white font-semibold">
										{queueDepth} jobs
									</span>
								</div>
								<Slider
									value={[queueDepth]}
									min={3}
									max={30}
									step={1}
									onValueChange={(value) => setQueueDepth(value[0])}
								/>
							</div>
							<p className="text-xs text-[#a9a9a9]">
								Runs above the limit are queued until capacity frees up. Hard
								budgets remain authoritative.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-[#0f0f0f]/80 border-[#222] backdrop-blur">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<BoltIcon className="w-4 h-4" />
								Observability
							</CardTitle>
							<Badge className="bg-purple-500/20 border border-purple-500/30 text-purple-200">
								per node
							</Badge>
						</CardHeader>
						<CardContent className="space-y-4 text-sm text-[#d7d7d7]">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold">Central log</p>
									<p className="text-xs text-[#a9a9a9]">
										Write input/output tokens, model, and costs per node.
									</p>
								</div>
								<Switch
									checked={loggingEnabled}
									onCheckedChange={setLoggingEnabled}
								/>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold">Alerts</p>
									<p className="text-xs text-[#a9a9a9]">
										Notify at 80% budget, anomalous runtime, or model change.
									</p>
								</div>
								<Switch
									checked={alertingEnabled}
									onCheckedChange={setAlertingEnabled}
								/>
							</div>
							<div className="rounded-lg border border-[#1e1e1e] bg-[#111]/60 p-3 space-y-2 text-xs text-[#b9b9b9]">
								<p className="font-semibold text-white">
									Log format per LLM node
								</p>
								<ul className="grid grid-cols-1 gap-1 list-disc list-inside">
									<li>model + provider (e.g. gpt-4o-mini)</li>
									<li>input/output tokens and price per 1K</li>
									<li>total cost and runtime per node</li>
									<li>run id, project id, and timestamp</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card className="bg-[#0b0b0b]/80 border-[#222]">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<ClockIcon className="w-4 h-4" />
								Current spend
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between text-sm">
								<div className="space-y-1">
									<p className="text-[#c5c5c5]">Workspace</p>
									<p className="text-2xl font-semibold">
										{formatUsd(totals.spent)}
										<span className="text-sm text-[#999]">
											{" "}
											/ {formatUsd(workspaceBudget)}
										</span>
									</p>
								</div>
								<Badge className="bg-[#1e1e1e] border border-[#2c2c2c] text-[#d5d5d5]">
									{budgetProgress.toFixed(0)}% used
								</Badge>
							</div>
							<Progress value={budgetProgress} className="h-2" />
							<div className="grid grid-cols-2 gap-3 text-sm text-[#c5c5c5]">
								<div className="rounded-lg border border-[#1d1d1d] bg-[#101010] p-3 space-y-1">
									<p className="text-xs uppercase text-[#7f7f7f]">
										Input tokens
									</p>
									<p className="text-lg font-semibold">
										{formatTokens(totals.tokensIn)}
									</p>
								</div>
								<div className="rounded-lg border border-[#1d1d1d] bg-[#101010] p-3 space-y-1">
									<p className="text-xs uppercase text-[#7f7f7f]">
										Output tokens
									</p>
									<p className="text-lg font-semibold">
										{formatTokens(totals.tokensOut)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="bg-[#0b0b0b]/80 border-[#222]">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<BoltIcon className="w-4 h-4" />
								Live guardrails
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm text-[#d7d7d7]">
							<div className="flex justify-between items-center">
								<span className="text-[#c5c5c5]">
									Hard stop per run ({formatUsd(runHardCap)})
								</span>
								<Badge className="bg-[#141414] border border-[#252525] text-[#c9c9c9]">
									{killSwitchEnabled ? "active" : "disabled"}
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-[#c5c5c5]">
									Parallel nodes (cap {concurrencyLimit})
								</span>
								<Badge className="bg-[#141414] border border-[#252525] text-[#c9c9c9]">
									{queueDepth} queued allowed
								</Badge>
							</div>
							<p className="text-xs text-[#9b9b9b]">
								Budgets apply per project ({formatUsd(defaultProjectCap)}{" "}
								default). Runs that exceed budget are stopped immediately and
								logged.
							</p>
						</CardContent>
					</Card>
				</div>

				<Card className="bg-[#0b0b0b]/90 border-[#1f1f1f]">
					<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="text-lg">Project ledger</CardTitle>
							<p className="text-sm text-[#a5a5a5]">
								Visibility into budget, tokens, and runtime per project.
							</p>
						</div>
						<Badge className="bg-[#1d1d1d] border border-[#2b2b2b] text-[#dcdcdc]">
							{projectBudgets.length} projects monitored
						</Badge>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow className="border-[#1f1f1f]">
									<TableHead className="text-[#a5a5a5]">Project</TableHead>
									<TableHead className="text-[#a5a5a5]">Budget</TableHead>
									<TableHead className="text-[#a5a5a5]">Spent</TableHead>
									<TableHead className="text-[#a5a5a5]">Tokens (in/out)</TableHead>
									<TableHead className="text-[#a5a5a5]">Runs</TableHead>
									<TableHead className="text-[#a5a5a5]">Concurrency</TableHead>
									<TableHead className="text-[#a5a5a5]">Last run</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{projectBudgets.map((project) => {
									const percentage =
										project.limit > 0
											? Math.min(100, (project.spent / project.limit) * 100)
											: 0;
									const statusBadge =
										percentage >= 95
											? {
													label: "near cap",
													className:
														"bg-red-500/20 border-red-500/30 text-red-200",
											  }
											: percentage >= 75
												? {
														label: "watch",
														className:
															"bg-amber-500/20 border-amber-500/30 text-amber-100",
												  }
												: {
														label: "room left",
														className:
															"bg-green-500/15 border-green-500/25 text-green-200",
												  };

									return (
										<TableRow key={project.name} className="border-[#1f1f1f]">
											<TableCell className="font-semibold text-white">
												<div className="flex items-center gap-2">
													<span>{project.name}</span>
													<Badge className={statusBadge.className}>
														{statusBadge.label}
													</Badge>
												</div>
											</TableCell>
											<TableCell className="text-[#d3d3d3]">
												{formatUsd(project.limit)}
											</TableCell>
											<TableCell className="text-[#d3d3d3]">
												<div className="flex items-center gap-2">
													<span>{formatUsd(project.spent)}</span>
													<span className="text-xs text-[#8f8f8f]">
														({percentage.toFixed(0)}%)
													</span>
												</div>
											</TableCell>
											<TableCell className="text-[#d3d3d3]">
												<div className="flex items-center gap-2 text-xs text-[#c5c5c5]">
													<span>{formatTokens(project.tokensIn)} in</span>
													<span className="text-[#666]">/</span>
													<span>{formatTokens(project.tokensOut)} out</span>
												</div>
											</TableCell>
											<TableCell className="text-[#d3d3d3]">
												<div className="flex flex-col">
													<span className="font-semibold">{project.runs}</span>
													<span className="text-xs text-[#a1a1a1]">
														avg {project.avgRuntime}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-[#d3d3d3]">
												<div className="text-xs text-[#c5c5c5]">
													<span className="font-semibold">
														{project.concurrencyLimit} nodes
													</span>
													<span className="text-[#8f8f8f]"> max</span>
												</div>
											</TableCell>
											<TableCell className="text-[#d3d3d3]">
												{project.lastRun}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold">Latest runs</h2>
							<p className="text-sm text-[#a5a5a5]">
								Per run insight into tokens, costs, and which nodes were hit.
							</p>
						</div>
						<Badge className="bg-[#161616] border border-[#2c2c2c] text-[#d6d6d6]">
							central store -&gt; UI
						</Badge>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{runHistory.map((run) => {
							const statusMap = {
								ok: {
									label: "within budget",
									className:
										"bg-green-500/20 border border-green-500/30 text-green-100",
								},
								warn: {
									label: "near cap",
									className:
										"bg-amber-500/20 border border-amber-500/30 text-amber-100",
								},
								stopped: {
									label: "stopped on limit",
									className:
										"bg-red-500/20 border border-red-500/30 text-red-100",
								},
							} as const;

							return (
								<Card
									key={run.id}
									className="bg-[#0c0c0c]/80 border-[#1f1f1f] shadow-inner"
								>
									<CardHeader className="flex flex-col gap-2">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg font-semibold text-white">
												{run.id}
											</CardTitle>
											<Badge className={statusMap[run.status].className}>
												{statusMap[run.status].label}
											</Badge>
										</div>
										<div className="flex flex-wrap gap-3 text-sm text-[#c5c5c5]">
											<span className="text-[#9d9d9d]">{run.project}</span>
											<span className="text-[#555]">|</span>
											<span>{run.started}</span>
											<span className="text-[#555]">|</span>
											<span>runtime {run.duration}</span>
											<span className="text-[#555]">|</span>
											<span>model {run.model}</span>
											<span className="text-[#555]">|</span>
											<span>{run.concurrencyUsed} nodes parallel</span>
										</div>
										<div className="flex gap-4 text-sm text-[#d7d7d7]">
											<div className="flex flex-col">
												<span className="text-xs text-[#8f8f8f]">Cost</span>
												<span className="font-semibold">
													{formatUsd(run.totalCost)}
												</span>
											</div>
											<div className="flex flex-col">
												<span className="text-xs text-[#8f8f8f]">Tokens</span>
												<span className="font-semibold">
													{formatTokens(run.inputTokens)} in /{" "}
													{formatTokens(run.outputTokens)} out
												</span>
											</div>
										</div>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="rounded-lg border border-[#1e1e1e] bg-[#101010] overflow-hidden">
											<Table>
												<TableHeader>
													<TableRow className="border-[#1e1e1e]">
														<TableHead className="text-[#a5a5a5]">
															Node
														</TableHead>
														<TableHead className="text-[#a5a5a5]">
															Model
														</TableHead>
														<TableHead className="text-[#a5a5a5]">
															Tokens (in/out)
														</TableHead>
														<TableHead className="text-[#a5a5a5]">
															Cost
														</TableHead>
														<TableHead className="text-[#a5a5a5]">
															Runtime
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{run.nodes.map((node) => {
														const nodeStatus =
															node.status === "cut"
																? {
																		label: "hard stop",
																		className:
																			"bg-red-500/20 border-red-500/30 text-red-100",
																  }
																: node.status === "warn"
																	? {
																			label: "costly",
																			className:
																				"bg-amber-500/20 border-amber-500/30 text-amber-100",
																	  }
																	: {
																			label: "ok",
																			className:
																				"bg-green-500/20 border-green-500/30 text-green-100",
																	  };

														return (
															<TableRow
																key={node.name}
																className="border-[#1e1e1e]"
															>
																<TableCell className="text-white">
																	<div className="flex items-center gap-2">
																		<span>{node.name}</span>
																		<Badge className={nodeStatus.className}>
																			{nodeStatus.label}
																		</Badge>
																	</div>
																</TableCell>
																<TableCell className="text-[#d3d3d3]">
																	{node.model}
																</TableCell>
																<TableCell className="text-[#d3d3d3]">
																	<div className="flex gap-2 text-xs text-[#c5c5c5]">
																		<span>
																			{formatTokens(node.inputTokens)} in
																		</span>
																		<span className="text-[#555]">/</span>
																		<span>
																			{formatTokens(node.outputTokens)} out
																		</span>
																	</div>
																</TableCell>
																<TableCell className="text-[#d3d3d3]">
																	{formatUsd(node.cost)}
																</TableCell>
																<TableCell className="text-[#d3d3d3]">
																	{node.runtime}
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
										</div>
										<p className="text-xs text-[#8f8f8f]">
											All node logs are stored in the central datastore and are
											available via the API and this UI.
										</p>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Settings;
