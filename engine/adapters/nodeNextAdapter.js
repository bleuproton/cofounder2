import fs from "fs";
import path from "path";

const STACK_ID = "node-nextjs";

function supports(stack) {
	return stack === STACK_ID;
}

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function writeFile(target, content) {
	ensureDir(path.dirname(target));
	fs.writeFileSync(target, content, "utf8");
}

function packageJson(name) {
	return JSON.stringify(
		{
			name,
			private: true,
			version: "0.0.1",
			type: "module",
			scripts: {
				dev: "next dev",
				build: "next build",
				start: "next start",
			},
			dependencies: {
				next: "14.2.0",
				react: "18.3.1",
				"react-dom": "18.3.1",
			},
		},
		null,
		2,
	);
}

function indexPage() {
	return `export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>
      <div>
        <h1>Hello from Cofounder (Next.js scaffold)</h1>
        <p>This is a minimal scaffold. Add your routes, components, and API handlers.</p>
      </div>
    </main>
  );
}
`;
}

function scaffold(service, targetDir) {
	ensureDir(targetDir);
	writeFile(path.join(targetDir, "package.json"), packageJson(service?.name || "next-app"));
	writeFile(path.join(targetDir, "pages/index.js"), indexPage());
	writeFile(
		path.join(targetDir, "next.config.js"),
		`/** Minimal Next.js config for headless adapter scaffold */\nconst nextConfig = {};\nexport default nextConfig;\n`,
	);
}

export default {
	supports,
	scaffold,
	stack: STACK_ID,
};
