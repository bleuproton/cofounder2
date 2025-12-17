import fs from "fs";
import path from "path";

const STACK_ID = "node-vite";

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
				dev: "vite",
				build: "vite build",
				preview: "vite preview",
			},
			dependencies: {
				react: "18.3.1",
				"react-dom": "18.3.1",
			},
			devDependencies: {
				vite: "5.4.10",
				"@vitejs/plugin-react": "4.3.1",
			},
		},
		null,
		2,
	);
}

function indexHtml() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cofounder Vite Scaffold</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

function mainJsx() {
	return `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
}

function appJsx() {
	return `export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>
      <div>
        <h1>Hello from Cofounder (Vite + React scaffold)</h1>
        <p>This is a minimal scaffold. Add your components and routes.</p>
      </div>
    </div>
  );
}
`;
}

function viteConfig() {
	return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;
}

function scaffold(service, targetDir) {
	ensureDir(targetDir);
	writeFile(path.join(targetDir, "package.json"), packageJson(service?.name || "vite-app"));
	writeFile(path.join(targetDir, "index.html"), indexHtml());
	writeFile(path.join(targetDir, "src/main.jsx"), mainJsx());
	writeFile(path.join(targetDir, "src/App.jsx"), appJsx());
	writeFile(path.join(targetDir, "vite.config.js"), viteConfig());
}

export default {
	supports,
	scaffold,
	stack: STACK_ID,
};
