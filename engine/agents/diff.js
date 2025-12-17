import fs from "fs";
import path from "path";

// Minimal unified diff parser and applier (no file deletions, supports additions/edits)

function parseDiff(diffText) {
	const lines = diffText.split("\n");
	const files = [];
	let current = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.startsWith("--- ")) {
			const from = line.replace(/^---\s+/, "").trim();
			const to = lines[++i]?.replace(/^\+\+\+\s+/, "").trim();
			current = {
				from,
				to,
				hunks: [],
			};
			files.push(current);
		} else if (line.startsWith("@@")) {
			const m = /@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/.exec(line);
			if (!m) throw new Error("Invalid hunk header");
			const hunk = {
				oldStart: parseInt(m[1], 10),
				oldLines: parseInt(m[2] || "0", 10),
				newStart: parseInt(m[3], 10),
				newLines: parseInt(m[4] || "0", 10),
				lines: [],
			};
			current.hunks.push(hunk);
			i++;
			for (; i < lines.length; i++) {
				const l = lines[i];
				if (l.startsWith("--- ") || l.startsWith("+++ ") || l.startsWith("@@")) {
					i -= 1;
					break;
				}
				if (!/^[ +\-]/.test(l) && l.length) throw new Error("Invalid diff line");
				hunk.lines.push(l);
			}
		}
	}
	return files;
}

function applyHunks(originalLines, hunks) {
	let cursorOld = 1;
	const result = [];
	for (const hunk of hunks) {
		// copy unchanged lines until hunk
		while (cursorOld < hunk.oldStart) {
			result.push(originalLines[cursorOld - 1] ?? "");
			cursorOld++;
		}
		let idx = 0;
		for (const l of hunk.lines) {
			if (l.startsWith(" ")) {
				result.push(l.slice(1));
				cursorOld++;
				idx++;
			} else if (l.startsWith("+")) {
				result.push(l.slice(1));
				idx++;
			} else if (l.startsWith("-")) {
				cursorOld++;
				idx++;
			}
		}
	}
	// tail
	while (cursorOld - 1 < originalLines.length) {
		result.push(originalLines[cursorOld - 1]);
		cursorOld++;
	}
	return result;
}

function applyFilePatch(baseDir, filePatch) {
	const target = path.resolve(baseDir, filePatch.to.replace(/^b\//, "").replace(/^a\//, ""));
	const exists = fs.existsSync(target);
	const original = exists ? fs.readFileSync(target, "utf8").split("\n") : [];
	const nextLines = applyHunks(original, filePatch.hunks);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, nextLines.join("\n"), "utf8");
	return target;
}

function applyDiff({ baseDir, diffText, parsed, skipDeletions = false }) {
	const patches = parsed || parseDiff(diffText);
	const applied = [];
	for (const filePatch of patches) {
		const rawTo = filePatch.to.replace(/^b\//, "").replace(/^a\//, "");
		if (skipDeletions && rawTo === "/dev/null") {
			continue;
		}
		const targetPath = applyFilePatch(baseDir, filePatch);
		applied.push(targetPath);
	}
	return applied;
}

export default {
	parseDiff,
	applyDiff,
};
