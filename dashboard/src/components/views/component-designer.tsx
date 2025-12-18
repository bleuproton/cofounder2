import React, { useEffect, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	FolderIcon,
	ArrowPathIcon,
	ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

type ComponentDesignerProps = {
	projectId?: string;
	hideProjectPicker?: boolean;
};

const ComponentDesigner: React.FC<ComponentDesignerProps> = ({
	projectId,
	hideProjectPicker = false,
}) => {
	const SERVER_LOCAL_URL = "http://localhost:4200/api";
	const [projects, setProjects] = useState<{ id: string }[]>([]);
	const [selectedProject, setSelectedProject] = useState<string>(projectId || "");
	const [status, setStatus] = useState<string>("Idle");
	const [embedKey, setEmbedKey] = useState<number>(0);
	const [embedReachable, setEmbedReachable] = useState<boolean | null>(null);
	const theiaBaseUrl = useMemo(
		() => import.meta.env.VITE_THEIA_URL || "http://localhost:3030",
		[],
	);

	useEffect(() => {
		if (projectId) {
			setSelectedProject(projectId);
		}
	}, [projectId]);

	useEffect(() => {
		const fetchProjects = async () => {
			try {
				const res = await fetch(`${SERVER_LOCAL_URL}/projects/list`);
				const data = await res.json();
				setProjects(data.projects || []);
				if ((data.projects || []).length && !selectedProject && !projectId) {
					setSelectedProject(data.projects[0].id);
				}
			} catch (e) {
				setStatus("Failed to load projects");
			}
		};
		fetchProjects();
	}, [projectId, selectedProject]);

	const embedUrl = useMemo(() => {
		try {
			const url = new URL(theiaBaseUrl);
			if (selectedProject) {
				url.searchParams.set("workspace", selectedProject);
			}
			return url.toString();
		} catch (e) {
			setStatus("Invalid Theia URL");
			return "";
		}
	}, [theiaBaseUrl, selectedProject]);

	useEffect(() => {
		let cancelled = false;
		const ping = async () => {
			if (!embedUrl) {
				setEmbedReachable(null);
				return;
			}
			try {
				const res = await fetch(embedUrl, { method: "HEAD", mode: "no-cors" });
				if (!cancelled) setEmbedReachable(true);
				return res;
			} catch (e) {
				if (!cancelled) setEmbedReachable(false);
			}
		};
		ping();
		return () => {
			cancelled = true;
		};
	}, [embedUrl, embedKey]);

	return (
		<div className="min-h-screen w-full bg-[#0b0b0f] text-white">
			<div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Badge className="bg-white/10 text-white border border-white/10">
								Component Designer
							</Badge>
							<Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
								Theia IDE
							</Badge>
						</div>
						<h1 className="text-3xl font-semibold tracking-tight">
							Edit and debug with the integrated Theia workspace
						</h1>
						<p className="text-sm text-[#b8b8c2] max-w-3xl">
							Full Theia IDE embedded in the dashboard. Pick a project to open its workspace; launch in a
							separate tab if you want the full window. Wire build/test buttons to your backend as needed.
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							className="font-normal flex items-center gap-2"
							onClick={() => {
								setStatus("Reloading Theia iframe...");
								setEmbedKey((k) => k + 1);
							}}
						>
							<ArrowPathIcon className="w-4 h-4" />
							Reload IDE
						</Button>
						<Button
							variant="outline"
							className="font-normal flex items-center gap-2"
							onClick={() => embedUrl && window.open(embedUrl, "_blank")}
							disabled={!embedUrl}
						>
							<ArrowTopRightOnSquareIcon className="w-4 h-4" />
							Open in new tab
							</Button>
						</div>
					</div>

			<Card className="bg-[#0f0f13] border-[#1d1d26]">
				<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="flex items-center gap-2">
						<FolderIcon className="w-4 h-4" />
						Theia workspace embed
					</CardTitle>
					<div className="flex flex-wrap gap-2">
						{!hideProjectPicker && (
							<select
								value={selectedProject}
								onChange={(e) => setSelectedProject(e.target.value)}
								className="bg-[#12121a] border border-[#1f1f2a] rounded-md px-3 py-2 text-sm"
							>
								{!selectedProject && <option value="">Select a project</option>}
								{projects.map((p) => (
									<option key={p.id} value={p.id}>
										{p.id}
									</option>
								))}
							</select>
						)}
						<Button
							variant="secondary"
							className="text-xs px-3 py-1"
							onClick={() => {
								if (embedUrl) navigator.clipboard.writeText(embedUrl);
								setStatus("Embed URL copied");
							}}
							disabled={!embedUrl}
						>
							Copy URL
						</Button>
						<Button
							variant="outline"
							className="text-xs px-3 py-1"
							onClick={() => embedUrl && window.open(embedUrl, "_blank")}
							disabled={!embedUrl}
						>
							<ArrowTopRightOnSquareIcon className="w-4 h-4" />
							New tab
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-[#d7d7e0]">
					<Input
						placeholder="Theia base URL (set VITE_THEIA_URL)"
						className="bg-[#12121a] border-[#1f1f2a] text-white"
						value={theiaBaseUrl}
						readOnly
					/>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<Badge className="bg-[#1c1c2a] border border-[#25253a]">
							{selectedProject || "No project selected"}
						</Badge>
						<div className="text-xs text-[#b8b8c2] flex gap-3 items-center">
							<span>
								{embedUrl
									? embedReachable
										? "Embedded Theia reachable"
										: "Theia unreachable (start the service or update VITE_THEIA_URL)"
									: "Set VITE_THEIA_URL"}
							</span>
							<Button
								variant="secondary"
								className="text-xs px-3 py-1"
								onClick={() => {
									setStatus("Reloading Theia iframe...");
									setEmbedKey((k) => k + 1);
								}}
								disabled={!embedUrl}
							>
								<ArrowPathIcon className="w-4 h-4" />
								Reload
							</Button>
						</div>
					</div>
					<div className="rounded-lg border border-[#1f1f2a] overflow-hidden bg-black/50">
						{embedUrl && embedReachable !== false ? (
							<iframe
								key={embedKey}
								src={embedUrl}
								title="Theia IDE"
								className="w-full h-[720px] border-0"
							/>
						) : (
							<div className="p-6 text-center text-[#8d8da0]">
								{embedUrl
									? "Theia is not reachable. Start the Theia service at VITE_THEIA_URL (default http://localhost:3030) or update the URL, then Reload."
									: "Set VITE_THEIA_URL in your dashboard env to load Theia (default http://localhost:3030)."}
							</div>
						)}
					</div>
					<div className="rounded-lg border border-[#1f1f2a] bg-[#0e0e15] p-3 space-y-2 text-xs text-[#c5c5d6]">
						<p className="text-[#8d8da0]">Workspace routing</p>
						<p>
							Theia opens the workspace using the <code>workspace</code> query parameter. Selecting a project
							appends it automatically.
						</p>
						<p className="text-[#8d8da0]">
							Ensure the Theia service exposes the workspace you expect (e.g. via /services/&lt;id&gt; mount).
						</p>
						<p className="text-emerald-300">Status: {status}</p>
					</div>
				</CardContent>
			</Card>
			</div>
		</div>
	);
};

export default ComponentDesigner;
