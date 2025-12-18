import React, { useCallback, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { resetProject } from "@/store/main";

import Flow from "@/components/views/flow.tsx";
import Events from "@/components/views/events.tsx";
import ComponentDesigner from "@/components/views/component-designer.tsx";
import { ExternalLink } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

const Project: React.FC = () => {
	const { project } = useParams();
	const [tab, setTab] = useState("blueprint");
	const [pingServer, setPingServer] = useState(false);
	const [pingApp, setPingApp] = useState(false);
	const [pingServerChecked, setPingServerChecked] = useState(false);
	const [startingApp, setStartingApp] = useState(false);
	const [startError, setStartError] = useState("");
	const [startMessage, setStartMessage] = useState("");

	const [initialLoad, setInitialLoad] = useState(false);

	const tabs = ["blueprint", "live", "editor", "export"];

	const SERVER_LOCAL_URL = "http://localhost:4200/api";
	const WEBAPP_LOCAL_URL = "http://localhost:5173";

	const dispatch = useDispatch();

	useEffect(() => {
		if (!initialLoad) {
			setInitialLoad(true);
			dispatch(resetProject());
		}
	}, []);

	const checkPingApp = useCallback(async () => {
		try {
			const response = await fetch(WEBAPP_LOCAL_URL);
			if (response.ok) {
				setPingApp(true);
				return true;
			} else {
				setPingApp(false);
				return false;
			}
		} catch (error) {
			setPingApp(false);
			return false;
		}
	}, [WEBAPP_LOCAL_URL]);

	useEffect(() => {
		if (tab === "blueprint") {
			const checkPingServer = async () => {
				try {
					const response = await fetch(`${SERVER_LOCAL_URL}/ping`);
					if (response.ok) {
						setPingServer(true);
					} else {
						setPingServer(false);
					}
				} catch (error) {
					setPingServer(false);
				}
				setPingServerChecked(true);
			};

			checkPingServer();
		}
		if (tab === "live") {
			checkPingApp();
		}
	}, [tab, checkPingApp]);

	const startApp = useCallback(async () => {
		if (!project) return;
		setStartingApp(true);
		setStartError("");
		setStartMessage("");
		try {
			const response = await fetch(`${SERVER_LOCAL_URL}/projects/${project}/start-app`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ port: 5173 }),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || "failed to start app");
			}
			setStartMessage(data?.message || data?.status || "starting app");
			// Poll for availability
			for (let i = 0; i < 20; i++) {
				await new Promise((r) => setTimeout(r, 500));
				const ok = await checkPingApp();
				if (ok) break;
			}
		} catch (error) {
			setStartError(error?.message || "failed to start app");
		} finally {
			setStartingApp(false);
		}
	}, [SERVER_LOCAL_URL, checkPingApp, project]);

	if (!pingServerChecked) return <></>;
	return (
		<>
			{(project?.length && (
				<>
					{/*<Cmdl />*/}
					<div
						className={`fixed top-0 z-10
											bg-[#333]/20
											backdrop-blur-md
											rounded-lg shadow-md
											text-sm text-white font-light
											mt-4 p-2 ml-2 sm:ml-0
											sm:left-1/2 sm:transform sm:-translate-x-1/2
											px-6 `}
					>
						<ul className="flex justify-center space-x-4 items-center">
							<Link
								className={`cursor-pointer p-2 rounded-xl hover:bg-[#333]/50 px-3`}
								key={project}
								to={`/projects`}
							>
								<li>{"<"}</li>
							</Link>
							{tabs.map((tabName) => (
								<li
									key={tabName}
									className={`cursor-pointer p-2 rounded-xl hover:bg-[#333]/50 flex items-center gap-2 px-3
											${tab === tabName ? "bg-black/50" : ""}`}
									onClick={() => setTab(tabName)}
								>
									{tabName.charAt(0).toUpperCase() + tabName.slice(1)}
									{(tabName === "live" && (
										<>
											<a
												href="http://localhost:5371"
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center rounded-xl hover:bg-[#111] p-2"
											>
												<ExternalLink className="w-3 h-3" />
											</a>
										</>
									)) ||
										""}
								</li>
							))}
						</ul>
					</div>

					<div className={tab === "blueprint" ? "" : "hidden"}>
						{(pingServer && (
							<>
								<Flow project={project} />
								<Events project={project} />
							</>
						)) || (
							<>
								<div className="flex items-center justify-center h-screen w-full text-white">
									<h1 className="text-2xl font-light opacity-50 whitespace-pre-wrap break-all">
										{`{ local cofounder/api server at \`${SERVER_LOCAL_URL}\` not reachable }`}
										<br />
										<br />
										{`>\tmake sure local cofounder server is launched\n\t( use \`npm run start\` in cofounder/api/ )`}
									</h1>
								</div>
							</>
						)}
					</div>

					<div className={tab === "editor" ? "" : "hidden"}>
						<ComponentDesigner projectId={project || ""} hideProjectPicker />
					</div>

					<div className={tab === "export" ? "" : "hidden"}>
						<div className="w-full flex justify-center">
							<div className="container max-w-4xl text-white px-4 py-10">
								<Card className="bg-[#0f0f0f]/80 border-[#1f1f1f]">
									<CardHeader>
										<CardTitle className="text-xl font-semibold">
											Export project
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 text-sm text-[#d7d7d7]">
										<p>
											Download this project as a ZIP that works in external editors
											(VS Code, code-server, JetBrains). All files under the project
											folder are included.
										</p>
										<div className="flex flex-wrap gap-3">
											<Button
												className="flex items-center gap-2"
												onClick={() => {
													if (!project) return;
													const url = `${SERVER_LOCAL_URL}/projects/export/${project}?t=${Date.now()}`;
													window.open(url, "_blank");
												}}
											>
												<DownloadIcon className="w-4 h-4" />
												Download ZIP
											</Button>
										</div>
										<div className="rounded-lg border border-[#1f1f1f] bg-[#111]/70 p-3 text-xs text-[#b5b5b5] space-y-2">
											<p className="text-white font-semibold">Tips</p>
											<ul className="list-disc list-inside space-y-1">
												<li>Unzip and open the folder in your editor of choice.</li>
												<li>Run <code className="bg-[#151515] px-1 py-0.5 rounded border border-[#222]">npm install</code> then <code className="bg-[#151515] px-1 py-0.5 rounded border border-[#222]">npm run dev</code> for the app.</li>
												<li>Backend files are under <code className="bg-[#151515] px-1 py-0.5 rounded border border-[#222]">db/projects/{project}</code>.</li>
											</ul>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>

					<div className={tab === "live" ? "" : "hidden"}>
						<>
							<div className="flex items-center justify-center h-screen w-full text-white">
								{(pingApp && (
									<>
										<iframe
											src={WEBAPP_LOCAL_URL}
											className="w-full mt-[12vh] min-h-[88vh] border-t border-[#222] overflow-auto"
											style={{
												position: "absolute",
												top: 0,
												left: 0,
												right: 0,
												bottom: 0,
											}}
											title="Live mode"
											sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
										></iframe>
									</>
								)) || (
									<>
										<div className="flex items-center justify-center h-screen w-full text-white">
											<div className="bg-black/60 border border-[#222] rounded-lg p-6 space-y-4 max-w-xl text-center">
												<h1 className="text-xl font-semibold text-white">
													{`App at \`${WEBAPP_LOCAL_URL}\` not reachable`}
												</h1>
												<p className="text-sm text-[#b8b8c2] whitespace-pre-wrap">
													Launch the exported app dev server for this project directly from the UI.
												</p>
												<div className="flex flex-col gap-2">
													<Button
														disabled={startingApp}
														onClick={startApp}
														className="mx-auto w-full sm:w-auto"
													>
														{startingApp ? "Starting..." : "Start local dev server"}
													</Button>
													{startMessage && (
														<p className="text-emerald-300 text-xs">{startMessage}</p>
													)}
													{startError && (
														<p className="text-red-300 text-xs whitespace-pre-wrap">
															{startError}
														</p>
													)}
												</div>
												<p className="text-xs text-[#80808f] whitespace-pre-wrap">
													{`Either the Vite server is not running (apps/${project}) or there is an issue in app root/store/view.`}
												</p>
											</div>
										</div>
									</>
								)}
							</div>
						</>
					</div>
				</>
			)) || (
				<>
					<div className="flex items-center justify-center h-screen w-full text-white">
						<h1 className="text-2xl font-light opacity-50 whitespace-pre-wrap break-all">
							{`{ project not set ; double check your url }`}
						</h1>
					</div>
				</>
			)}
		</>
	);
};

export default Project;
