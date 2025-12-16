import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Editor from "@monaco-editor/react";
import {
	FolderIcon,
	DocumentDuplicateIcon,
	ArrowDownTrayIcon,
	PlayIcon,
	BoltIcon,
	ArrowPathIcon,
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
	const [files, setFiles] = useState<{ path: string }[]>([]);
	const [filter, setFilter] = useState("");
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [value, setValue] = useState<string>("");
	const [autoSave, setAutoSave] = useState(true);
	const [status, setStatus] = useState<string>("Idle");
	const [busy, setBusy] = useState<boolean>(false);
	const [loadingFiles, setLoadingFiles] = useState(false);
	const [loadingFile, setLoadingFile] = useState(false);
	const saveTimer = useRef<NodeJS.Timeout | null>(null);

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

	useEffect(() => {
		if (!selectedProject) return;
		const fetchFiles = async () => {
			try {
				setLoadingFiles(true);
				const res = await fetch(
					`${SERVER_LOCAL_URL}/editor/files?project=${encodeURIComponent(selectedProject)}`,
				);
				const data = await res.json();
				if (data.files) {
					const normalized = data.files.map((path) => ({ path }));
					setFiles(normalized);
					if (normalized.length) {
						setSelectedFile(normalized[0].path);
					} else {
						setSelectedFile("");
						setValue("");
					}
				}
			} catch (e) {
				setStatus("Failed to load files");
			} finally {
				setLoadingFiles(false);
			}
		};
		fetchFiles();
	}, [selectedProject]);

	useEffect(() => {
		const loadFile = async () => {
			if (!selectedProject || !selectedFile) return;
			try {
				setLoadingFile(true);
				const res = await fetch(
					`${SERVER_LOCAL_URL}/editor/file?project=${encodeURIComponent(selectedProject)}&path=${encodeURIComponent(selectedFile)}`,
				);
				const data = await res.json();
				if (data.content !== undefined) {
					setValue(data.content);
					setStatus(`Loaded ${selectedFile}`);
				}
			} catch (e) {
				setStatus("Failed to load file");
			} finally {
				setLoadingFile(false);
			}
		};
		loadFile();
	}, [selectedFile, selectedProject]);

	const saveFile = async (contentOverride?: string) => {
		if (!selectedProject || !selectedFile) return;
		try {
			setStatus("Saving...");
			setBusy(true);
			await fetch(`${SERVER_LOCAL_URL}/editor/file`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					project: selectedProject,
					path: selectedFile,
					content: contentOverride ?? value,
				}),
			});
			setStatus("Saved");
		} catch (e) {
			setStatus("Save failed");
		} finally {
			setBusy(false);
		}
	};

	useEffect(() => {
		if (!autoSave) return;
		if (!selectedProject || !selectedFile) return;
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => saveFile(), 900);
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [value, autoSave]);

	const filteredFiles = useMemo(
		() =>
			files.filter((f) =>
				f.path.toLowerCase().includes(filter.toLowerCase()),
			),
		[files, filter],
	);

	const triggerBuild = () => {
		setStatus("Build triggered (wire backend to run)");
	};

	const triggerTests = () => {
		setStatus("Tests triggered (wire backend to run)");
	};

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
								Built-in IDE
							</Badge>
						</div>
						<h1 className="text-3xl font-semibold tracking-tight">
							Edit your project live without leaving the dashboard
						</h1>
						<p className="text-sm text-[#b8b8c2] max-w-3xl">
							Monaco-powered editor with file tree, status panel, and quick actions. Wire the save/run
							handlers to your backend to persist files and trigger builds.
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							className="font-normal flex items-center gap-2"
							onClick={() => {
								if (selectedProject) {
									setStatus("Syncing files...");
									// trigger re-fetch
									const currentProject = selectedProject;
									setSelectedProject("");
									setTimeout(() => setSelectedProject(currentProject), 10);
								}
							}}
						>
							<ArrowPathIcon className="w-4 h-4" />
							Sync files
						</Button>
						<Button className="font-normal flex items-center gap-2" onClick={triggerBuild}>
							<BoltIcon className="w-4 h-4" />
							Run build
						</Button>
					</div>
				</div>

				<Card className="bg-[#0f0f13] border-[#1d1d26]">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FolderIcon className="w-4 h-4" />
							Project files
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-[#d7d7e0]">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
							<div className="md:col-span-1 space-y-3">
								{!hideProjectPicker && (
									<div className="space-y-1">
										<p className="text-xs uppercase tracking-wide text-[#8d8da0]">Project</p>
										<select
											value={selectedProject}
											onChange={(e) => setSelectedProject(e.target.value)}
											className="w-full bg-[#12121a] border border-[#1f1f2a] rounded-md px-3 py-2 text-sm"
										>
											{!selectedProject && <option value="">Select a project</option>}
											{projects.map((p) => (
												<option key={p.id} value={p.id}>
													{p.id}
												</option>
											))}
										</select>
									</div>
								)}
								<Input
									placeholder="Filter files"
									className="bg-[#12121a] border-[#1f1f2a] text-white"
									value={filter}
									onChange={(e) => setFilter(e.target.value)}
								/>
								<div className="space-y-2 max-h-[320px] overflow-auto pr-1">
									{loadingFiles && (
										<div className="text-xs text-[#8d8da0]">Loading files...</div>
									)}
									{!loadingFiles && filteredFiles.length === 0 && (
										<div className="text-xs text-[#8d8da0]">No files found.</div>
									)}
									{filteredFiles.map((file) => (
										<button
											key={file.path}
											onClick={() => {
												setSelectedFile(file.path);
												setValue("// loading...");
											}}
											className={`w-full text-left px-3 py-2 rounded-md border text-xs transition ${
												selectedFile === file.path
													? "border-[#2f6bff] bg-[#132040]"
													: "border-[#1f1f2a] bg-[#0e0e15] hover:bg-[#14141f]"
											}`}
										>
											{file.path}
										</button>
									))}
								</div>
								<div className="flex gap-2">
									<Button variant="secondary" className="w-1/2 text-xs">
										New file
									</Button>
									<Button variant="outline" className="w-1/2 text-xs">
										Delete
									</Button>
								</div>
							</div>
							<div className="md:col-span-2 space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Badge className="bg-[#1c1c2a] border border-[#25253a]">
										{selectedFile}
									</Badge>
									<div className="flex items-center gap-3 text-xs text-[#b8b8c2]">
										<div className="flex items-center gap-2">
											<span>Auto-save</span>
											<Switch checked={autoSave} onCheckedChange={setAutoSave} />
										</div>
										<Button
											variant="ghost"
											className="text-xs px-2 py-1 flex items-center gap-1"
											onClick={() => {
												if (selectedFile) {
													navigator.clipboard.writeText(selectedFile);
													setStatus("Path copied");
												}
											}}
										>
											<DocumentDuplicateIcon className="w-4 h-4" />
											Copy path
										</Button>
										<Button
											variant="secondary"
											className="text-xs px-3 py-1 flex items-center gap-1"
											onClick={() => saveFile()}
											disabled={!selectedFile || busy}
										>
											<ArrowDownTrayIcon className="w-4 h-4" />
											Save
										</Button>
									</div>
								</div>
								<div className="rounded-lg border border-[#1f1f2a] overflow-hidden">
									<Editor
										height="420px"
										defaultLanguage="typescript"
										theme="vs-dark"
										value={value}
										onChange={(val) => setValue(val || "")}
										options={{
											fontSize: 13,
											minimap: { enabled: false },
											scrollBeyondLastLine: false,
											wordWrap: "on",
										}}
									/>
								</div>
								<div className="flex gap-2">
									<Button className="font-normal text-xs flex items-center gap-2" onClick={triggerTests}>
										<PlayIcon className="w-4 h-4" />
										Run tests
									</Button>
									<Button variant="outline" className="font-normal text-xs flex items-center gap-2">
										<BoltIcon className="w-4 h-4" />
										AI refactor
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-[#0f0f13] border-[#1d1d26]">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PlayIcon className="w-4 h-4" />
							Status & Console
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#d7d7e0]">
						<div className="space-y-2">
							<p className="text-xs uppercase tracking-wide text-[#8d8da0]">Workspace</p>
							<div className="rounded-lg border border-[#1f1f2a] bg-[#0d0d14] p-3 space-y-2 text-xs text-[#c5c5d6]">
								<div className="flex justify-between">
									<span>Branch</span>
									<span className="text-white">main</span>
								</div>
								<div className="flex justify-between">
									<span>Dirty files</span>
									<span className="text-white">{autoSave ? "0" : "1+"}</span>
								</div>
								<div className="flex justify-between">
									<span>Status</span>
									<span className="text-emerald-300">{status}</span>
								</div>
							</div>
						</div>
						<div className="md:col-span-2 space-y-2">
							<p className="text-xs uppercase tracking-wide text-[#8d8da0]">Console</p>
							<div className="rounded-lg border border-[#1f1f2a] bg-[#0d0d14] p-3 space-y-1 text-xs text-[#c5c5d6] min-h-[140px]">
								<p>&gt; status: {status}</p>
								<p>&gt; lint: pending</p>
								<p>&gt; tests: not run</p>
								<p>&gt; build: ready</p>
								<p className="text-[#8d8da0]">
									Wire save/run to your backend for live results. File APIs: /api/editor/files,
									/api/editor/file (GET/POST).
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default ComponentDesigner;
