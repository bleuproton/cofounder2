import fs from "fs";
import path from "path";

const STACK_ID = "python-fastapi";

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

function requirementsTxt() {
	return `fastapi==0.111.0
uvicorn==0.30.1
`;
}

function appPy() {
	return `from fastapi import FastAPI

app = FastAPI(title="Cofounder FastAPI Scaffold")

@app.get("/")
def read_root():
    return {"message": "Hello from Cofounder (FastAPI scaffold)"}
`;
}

function scaffold(service, targetDir) {
	ensureDir(targetDir);
	writeFile(path.join(targetDir, "requirements.txt"), requirementsTxt());
	writeFile(path.join(targetDir, "app.py"), appPy());
	writeFile(
		path.join(targetDir, "README.md"),
		`# FastAPI scaffold

- Dev server: uvicorn app:app --reload --port ${service?.port || 8000}
- Install deps: pip install -r requirements.txt
`,
	);
}

export default {
	supports,
	scaffold,
	stack: STACK_ID,
};
