import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

//#region src/modules/harness/services/redaction.service.ts
const SECRET_PATTERNS = [
	/\bsk-[A-Za-z0-9_-]{8,}/g,
	/\bAKIA[0-9A-Z]{16}\b/g,
	/\bBearer\s+\S+/gi,
	/\b(?:api[_-]?key|token|password|secret|authorization)["']?\s*[:=]\s*\S+/gi
];
const redactSecrets = (text) => {
	return SECRET_PATTERNS.reduce((acc, pattern) => {
		return acc.replace(pattern, "[redacted]");
	}, text);
};
const firstLine = (text) => {
	return text.split(/\r?\n/, 1)[0] ?? "";
};

//#endregion
//#region src/modules/harness/constants/harness-limits.constant.ts
const MEMORY_WARN_RATIO = .8;
const DAY_MS = 864e5;
const MEMORY_GUARD_TOOLS = /* @__PURE__ */ new Set([
	"Write",
	"Edit",
	"MultiEdit"
]);
const HOOK_ERROR_LOG_MAX_BYTES = 65536;

//#endregion
//#region src/modules/harness/constants/harness-paths.constant.ts
const HARNESS_DIR = ".harness";
const HARNESS_MEMORY = `${HARNESS_DIR}/MEMORY.md`;
const HARNESS_BOOTSTRAP = `${HARNESS_DIR}/BOOTSTRAP.md`;
const HARNESS_CONFIG = `${HARNESS_DIR}/config.json`;
const HARNESS_CURATOR = `${HARNESS_DIR}/curator.json`;
const HARNESS_DECISIONS_DIR = `${HARNESS_DIR}/decisions`;
const HARNESS_DOCS_DIR = `${HARNESS_DIR}/docs`;
const HARNESS_STATE_DIR = `${HARNESS_DIR}/state`;
const HARNESS_SESSIONS_DIR = `${HARNESS_STATE_DIR}/sessions`;
const HARNESS_ERROR_LOG = `${HARNESS_STATE_DIR}/hook-errors.log`;
const HARNESS_ERROR_CURSOR = `${HARNESS_STATE_DIR}/hook-errors.cursor`;
const HARNESS_SKILL_USAGE = `${HARNESS_STATE_DIR}/skill-usage.json`;
const CLAUDE_SKILLS_DIR = ".claude/skills";
const AGENT_KIT_CONFIG = ".agentkit/config.yaml";

//#endregion
//#region src/modules/harness/services/session-log.service.ts
const sessionIdOf = (raw) => {
	return raw.replace(/[^A-Za-z0-9_-]/g, "_") || "unknown";
};
const logPath = (root, sessionId) => {
	return join(root, HARNESS_SESSIONS_DIR, `${sessionIdOf(sessionId)}.jsonl`);
};
const appendSessionEvent = (root, sessionId, event) => {
	const path = logPath(root, sessionId);
	mkdirSync(join(root, HARNESS_SESSIONS_DIR), { recursive: true });
	writeFileSync(path, `${JSON.stringify(event)}\n`, { flag: "a" });
};
const readSessionLog = (root, sessionId) => {
	const path = logPath(root, sessionId);
	if (!existsSync(path)) return [];
	return readFileSync(path, "utf8").split("\n").filter((line) => {
		return line !== "";
	}).flatMap((line) => {
		try {
			return [JSON.parse(line)];
		} catch {
			return [];
		}
	});
};
const pruneSessions = (root, now = Date.now()) => {
	const dir = join(root, HARNESS_SESSIONS_DIR);
	if (!existsSync(dir)) return;
	const cutoff = now - 7 * DAY_MS;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isFile()) continue;
		const full = join(dir, entry.name);
		if (statSync(full).mtimeMs < cutoff) unlinkSync(full);
	}
};

//#endregion
//#region src/modules/harness/hooks/post-tool-use-failure.hook.ts
const postToolUseFailureHook = (root, payload, _ctx) => {
	if (payload.is_interrupt === true) return null;
	appendSessionEvent(root, payload.session_id ?? "", {
		type: "fail",
		at: (/* @__PURE__ */ new Date()).toISOString(),
		tool: payload.tool_name ?? "",
		error: redactSecrets(firstLine(payload.error ?? ""))
	});
	return null;
};

//#endregion
//#region src/modules/harness/templates/harness-config.template.ts
const HARNESS_CONFIG_DEFAULTS = {
	review: { minToolCalls: 14 },
	memory: {
		maxChars: 9600,
		maxEntryChars: 320
	},
	curator: {
		minLearnedSkills: 10,
		intervalDays: 7,
		staleDays: 14,
		archiveDays: 28
	}
};

//#endregion
//#region src/modules/harness/services/config.service.ts
const EMPTY_CONFIG = {
	review: {},
	memory: {},
	curator: {}
};
const REPAIR_HINT = "run \"jss-devtools harness update\" to restore the default keys";
const NUMBER_KEYS = Object.keys(HARNESS_CONFIG_DEFAULTS).flatMap((group) => {
	return Object.entries(HARNESS_CONFIG_DEFAULTS[group]).filter(([, value]) => {
		return typeof value === "number";
	}).map(([key]) => {
		return [group, key];
	});
});
const groupOf = (config, group) => {
	const value = config?.[group];
	return typeof value === "object" && value !== null ? value : {};
};
const readConfig = (root) => {
	const path = join(root, HARNESS_CONFIG);
	const problems = [];
	let parsed = null;
	if (existsSync(path)) try {
		parsed = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		problems.push(`config.json is not valid JSON — ${REPAIR_HINT}`);
		parsed = null;
	}
	else problems.push(`config.json is missing — ${REPAIR_HINT}`);
	const config = { ...EMPTY_CONFIG };
	for (const [group, key] of NUMBER_KEYS) {
		const value = groupOf(parsed, group)[key];
		if (typeof value === "number" && Number.isFinite(value)) config[group][key] = value;
		else problems.push(`config.json is missing a usable "${group}.${key}" — ${REPAIR_HINT}`);
	}
	return {
		config,
		problems
	};
};

//#endregion
//#region src/modules/harness/services/memory.service.ts
const EMPTY_MEMORY = {
	exists: false,
	text: "",
	size: 0,
	entries: []
};
const readMemoryState = (root) => {
	const path = join(root, HARNESS_MEMORY);
	if (!existsSync(path)) return EMPTY_MEMORY;
	const text = readFileSync(path, "utf8");
	return {
		exists: true,
		text,
		size: text.length,
		entries: text.split("\n").filter((line) => {
			return line.startsWith("- ");
		})
	};
};
const memoryLimitProblems = (memory, maxChars, maxEntryChars) => {
	const problems = [];
	if (memory.size > maxChars) problems.push(`MEMORY.md is ${memory.size} chars, over the limit of ${maxChars}`);
	for (const entry of memory.entries) if (entry.length > maxEntryChars) problems.push(`a memory entry is ${entry.length} chars, over the per-entry limit of ${maxEntryChars}: ${entry.slice(0, 60)}…`);
	return problems;
};
const memoryNearCap = (size, maxChars) => {
	return size >= MEMORY_WARN_RATIO * maxChars;
};

//#endregion
//#region src/modules/harness/hooks/post-tool-use.hook.ts
const SKILL_REF = /skills\/([A-Za-z0-9_-]+)\/SKILL\.md/g;
const realPathOr = (path) => {
	try {
		return realpathSync(path);
	} catch {
		return resolve(path);
	}
};
const memoryFileOf = (root, toolInput) => {
	const raw = typeof toolInput.file_path === "string" ? toolInput.file_path : null;
	if (raw === null) return false;
	return realPathOr(raw) === realPathOr(join(root, HARNESS_MEMORY));
};
const memoryGuardHook = (root, payload, _ctx) => {
	const toolName = payload.tool_name ?? "";
	const toolInput = payload.tool_input ?? {};
	if (!MEMORY_GUARD_TOOLS.has(toolName) || !memoryFileOf(root, toolInput)) return null;
	const { config } = readConfig(root);
	const { maxChars, maxEntryChars } = config.memory;
	if (maxChars === void 0 || maxEntryChars === void 0) return null;
	const problems = memoryLimitProblems(readMemoryState(root), maxChars, maxEntryChars);
	if (problems.length === 0) return null;
	return {
		decision: "block",
		reason: `Memory limit broken: ${problems.join("; ")}`
	};
};
const toolLogHook = (root, payload, _ctx) => {
	if (payload.agent_id !== void 0) return null;
	const toolName = payload.tool_name ?? "";
	const toolInput = payload.tool_input ?? {};
	const skills = [];
	const command = typeof toolInput.command === "string" ? toolInput.command : null;
	const skillRefCandidates = [toolInput.file_path, command].filter((candidate) => {
		return typeof candidate === "string";
	});
	for (const candidate of skillRefCandidates) for (const match of candidate.matchAll(SKILL_REF)) {
		const name = match[1] ?? "";
		if (name !== "" && existsSync(join(root, ".claude/skills", name, "SKILL.md")) && !skills.includes(name)) skills.push(name);
	}
	const skillArg = toolInput.skill;
	if (toolName === "Skill" && typeof skillArg === "string" && existsSync(join(root, ".claude/skills", skillArg, "SKILL.md")) && !skills.includes(skillArg)) skills.push(skillArg);
	const onboarded = toolName === "AskUserQuestion" && /onboard|bootstrap/i.test(JSON.stringify(toolInput));
	appendSessionEvent(root, payload.session_id ?? "", {
		type: "tool",
		at: (/* @__PURE__ */ new Date()).toISOString(),
		tool: toolName,
		skills,
		onboarded
	});
	return null;
};

//#endregion
//#region src/modules/harness/services/decisions.service.ts
const DECISION_FILE = /^(\d{4})-.+\.md$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const frontmatterOf = (text) => {
	return text.match(FRONTMATTER)?.[1] ?? "";
};
const frontmatterValue = (block, key) => {
	return block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
};
const decisionFileIds = (root) => {
	return decisionFileNames(root).map((name) => {
		return name.slice(0, 4);
	});
};
const decisionFileNames = (root) => {
	const dir = join(root, HARNESS_DECISIONS_DIR);
	if (!existsSync(dir)) return [];
	return readdirSync(dir).filter((name) => {
		return DECISION_FILE.test(name);
	});
};
const decisionsInForce = (root) => {
	const dir = join(root, HARNESS_DECISIONS_DIR);
	return decisionFileNames(root).map((name) => {
		const text = readFileSync(join(dir, name), "utf8");
		const frontmatter = frontmatterOf(text);
		return {
			id: name.slice(0, 4),
			title: frontmatterValue(frontmatter, "title") || name,
			status: frontmatterValue(frontmatter, "status")
		};
	}).filter((decision) => {
		return !/^Superseded/i.test(decision.status);
	}).map(({ id, title }) => {
		return {
			id,
			title
		};
	});
};

//#endregion
//#region src/modules/harness/services/hook-errors.service.ts
const NEWLINE = 10;
const trimToNewestHalf = (path) => {
	const buffer = readFileSync(path);
	const start = buffer.length - Math.floor(buffer.length / 2);
	const newline = buffer.indexOf(NEWLINE, start);
	const kept = buffer.subarray(newline === -1 ? buffer.length : newline + 1);
	writeFileSync(path, kept);
	return buffer.length - kept.length;
};
const shiftCursor = (root, removed) => {
	const cursorPath = join(root, HARNESS_ERROR_CURSOR);
	if (!existsSync(cursorPath)) return;
	const cursor = Number(readFileSync(cursorPath, "utf8").trim() || "0");
	writeFileSync(cursorPath, String(Math.max(0, cursor - removed)));
};
const logHookError = (root, detail) => {
	try {
		const dir = join(root, HARNESS_STATE_DIR);
		mkdirSync(dir, { recursive: true });
		const path = join(root, HARNESS_ERROR_LOG);
		const line = `${(/* @__PURE__ */ new Date()).toISOString()} ${detail.replace(/\s+/g, " ").slice(0, 400)}\n`;
		if (existsSync(path) && statSync(path).size + Buffer.byteLength(line) > 65536) shiftCursor(root, trimToNewestHalf(path));
		writeFileSync(path, line, { flag: "a" });
	} catch {
		return;
	}
};
const hookErrorsSinceLastSession = (root) => {
	const logPath = join(root, HARNESS_ERROR_LOG);
	if (!existsSync(logPath)) return [];
	const cursorPath = join(root, HARNESS_ERROR_CURSOR);
	const buffer = readFileSync(logPath);
	const offset = existsSync(cursorPath) ? Number(readFileSync(cursorPath, "utf8").trim() || "0") : 0;
	const lines = buffer.subarray(offset > 0 && offset <= buffer.length ? offset : 0).toString("utf8").split("\n").filter((line) => {
		return line !== "";
	});
	mkdirSync(join(root, HARNESS_STATE_DIR), { recursive: true });
	writeFileSync(cursorPath, String(buffer.length));
	return lines;
};

//#endregion
//#region src/modules/harness/services/agent-kit.service.ts
const usesAgentKit = (root) => {
	return existsSync(join(root, AGENT_KIT_CONFIG));
};

//#endregion
//#region src/modules/harness/services/index-drift.service.ts
const cellsOf = (line) => {
	return line.split("|").slice(1, -1).map((cell) => {
		return cell.trim();
	});
};
const tablesOf = (readme) => {
	const tables = [];
	let current = null;
	for (const line of readme.split("\n")) {
		if (!line.startsWith("|")) {
			current = null;
			continue;
		}
		if (current === null) {
			current = [];
			tables.push(current);
		}
		current.push(cellsOf(line));
	}
	return tables;
};
const tableWithHeader = (readme, firstCell) => {
	const table = tablesOf(readme).find((rows) => {
		return rows[0]?.[0] === firstCell;
	});
	if (table === void 0) return [];
	return table.slice(1).filter((cells) => {
		return !/^-+$/.test(cells[0] ?? "");
	});
};
const linkTextOf = (cell) => {
	return cell.replace(/^\[/, "").replace(/\]\([^)]*\)$/, "");
};
const decisionRows = (readme) => {
	return tableWithHeader(readme, "#").map((cells) => {
		return linkTextOf(cells[0] ?? "");
	}).filter((id) => {
		return /^\d{4}$/.test(id);
	});
};
const docRowNames = (readme) => {
	return tableWithHeader(readme, "Doc").map((cells) => {
		return linkTextOf(cells[0] ?? "").replace(/\.md$/, "");
	}).filter((name) => {
		return name !== "";
	});
};
const decisionsDrift = (root) => {
	const dir = join(root, HARNESS_DECISIONS_DIR);
	if (!existsSync(dir)) return [];
	const readmePath = join(dir, "README.md");
	const files = decisionFileIds(root);
	const rows = existsSync(readmePath) ? decisionRows(readFileSync(readmePath, "utf8")) : [];
	const missing = files.filter((id) => {
		return !rows.includes(id);
	});
	const orphaned = rows.filter((id) => {
		return !files.includes(id);
	});
	const drift = [];
	if (missing.length > 0) drift.push(`decisions/README.md is missing rows for: ${missing.join(", ")}`);
	if (orphaned.length > 0) drift.push(`decisions/README.md has rows with no file: ${orphaned.join(", ")}`);
	return drift;
};
const docsDrift = (root) => {
	const dir = join(root, HARNESS_DOCS_DIR);
	if (!existsSync(dir)) return [];
	const readmePath = join(dir, "README.md");
	const files = readdirSync(dir).filter((name) => {
		return name.endsWith(".md") && name !== "README.md";
	}).map((name) => {
		return name.replace(/\.md$/, "");
	});
	const rows = existsSync(readmePath) ? docRowNames(readFileSync(readmePath, "utf8")) : [];
	const drift = [];
	const missing = files.filter((name) => {
		return !rows.includes(name);
	});
	if (missing.length > 0) drift.push(`docs/README.md is missing rows for: ${missing.join(", ")}`);
	const orphaned = rows.filter((name) => {
		return !files.includes(name);
	});
	if (orphaned.length > 0) drift.push(`docs/README.md has rows with no file: ${orphaned.join(", ")}`);
	return drift;
};
const indexDrift = (root) => {
	return [...decisionsDrift(root), ...usesAgentKit(root) ? [] : docsDrift(root)];
};

//#endregion
//#region src/modules/harness/hooks/session-start.hook.ts
const ONBOARDING_NOTICE = ["Onboarding is pending: `.harness/BOOTSTRAP.md` is present.", "Run the `harness-onboard` skill to seed the harness knowledge."].join(" ");
const sessionStartHook = (root, payload, ctx) => {
	const { config, problems } = readConfig(root);
	const warnings = [...problems];
	const sections = [];
	const memory = readMemoryState(root);
	const maxChars = config.memory.maxChars;
	if (memory.exists) {
		const overLimit = maxChars === void 0 ? [] : memoryLimitProblems(memory, maxChars, config.memory.maxEntryChars ?? 0);
		sections.push(`# Harness memory (${memory.entries.length} entries, ${memory.size}/${maxChars ?? "?"} chars)\n${memory.text}`);
		warnings.push(...overLimit);
	} else warnings.push("MEMORY.md is missing");
	if (maxChars !== void 0 && memory.exists && memoryNearCap(memory.size, maxChars)) warnings.push(`MEMORY.md is at ${Math.round(memory.size / maxChars * 100)}% of its ${maxChars} char limit — run the harness-curate skill`);
	if (existsSync(join(root, ".harness/BOOTSTRAP.md"))) sections.push(`## Onboarding\n${ONBOARDING_NOTICE}`);
	const decisions = decisionsInForce(root);
	if (decisions.length > 0) {
		const lines = decisions.map((item) => {
			return `- ${item.id} ${item.title}`;
		});
		sections.push(`## Decisions in force\n${lines.join("\n")}`);
	}
	for (const drift of indexDrift(root)) warnings.push(drift);
	for (const error of hookErrorsSinceLastSession(root)) warnings.push(`the hook error log recorded: ${error}`);
	appendSessionEvent(root, payload.session_id ?? "", {
		type: "start",
		at: (/* @__PURE__ */ new Date()).toISOString(),
		fingerprint: ctx.fingerprint
	});
	const additionalContext = sections.join("\n\n") + (warnings.length === 0 ? "" : `\n\n## Warnings\n${warnings.map((w) => {
		return `- ${w}`;
	}).join("\n")}`);
	if (additionalContext.trim() === "") return null;
	return { hookSpecificOutput: {
		hookEventName: "SessionStart",
		additionalContext
	} };
};

//#endregion
//#region src/modules/harness/services/learned-skills.service.ts
const learnedSkillNames = (root) => {
	const dir = join(root, CLAUDE_SKILLS_DIR);
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true }).filter((entry) => {
		return entry.isDirectory();
	}).map((entry) => {
		return entry.name;
	}).filter((name) => {
		const skill = join(dir, name, "SKILL.md");
		return existsSync(skill) && /^\s*harness-origin:\s*learned$/m.test(readFileSync(skill, "utf8"));
	});
};

//#endregion
//#region src/modules/harness/services/skill-usage.service.ts
const writeJson = (path, data) => {
	mkdirSync(join(path, ".."), { recursive: true });
	const temp = `${path}.${process.pid}.tmp`;
	try {
		writeFileSync(temp, `${JSON.stringify(data, null, "	")}\n`);
		renameSync(temp, path);
	} catch (error) {
		rmSync(temp, { force: true });
		throw error;
	}
};
const readJson = (root, path, label, fallback) => {
	if (!existsSync(path)) return {
		value: fallback,
		corrupt: false
	};
	try {
		return {
			value: JSON.parse(readFileSync(path, "utf8")),
			corrupt: false
		};
	} catch (error) {
		logHookError(root, `${label} is not valid JSON: ${error.message}`);
		return {
			value: fallback,
			corrupt: true
		};
	}
};
const foldSkillUsage = (root, names, today) => {
	const path = join(root, HARNESS_SKILL_USAGE);
	const { value: usage, corrupt } = readJson(root, path, HARNESS_SKILL_USAGE, {});
	if (names.length === 0 && !corrupt) return usage;
	const merged = { ...usage };
	for (const name of names) {
		const current = merged[name];
		merged[name] = current === void 0 || current < today ? today : current;
	}
	writeJson(path, merged);
	return merged;
};
const lastCuratorRun = (root) => {
	const path = join(root, HARNESS_CURATOR);
	if (!existsSync(path)) return null;
	const { value } = readJson(root, path, HARNESS_CURATOR, {});
	return typeof value.lastRun === "string" ? value.lastRun : null;
};
const recordCuratorRun = (root, day) => {
	writeJson(join(root, HARNESS_CURATOR), { lastRun: day });
};
const dayDiff = (from, to) => {
	const start = Date.parse(`${from}T00:00:00Z`);
	const end = Date.parse(`${to}T00:00:00Z`);
	return Number.isNaN(start) || Number.isNaN(end) ? null : Math.floor((end - start) / DAY_MS);
};

//#endregion
//#region src/modules/harness/hooks/stop.hook.ts
const unique = (names) => {
	return [...new Set(names)];
};
const ONBOARDING_ASK = "Onboarding pending: .harness/BOOTSTRAP.md is present — run the harness-onboard skill.";
const REVIEW_ASK = "A harness review is due: run the harness-review skill before you stop.";
const CURATION_ASK = "Harness curation is due: run the harness-curate skill before you stop.";
const reviewBaseline = (lines, uptoIndex) => {
	let baseline = null;
	for (let index = 0; index <= uptoIndex; index += 1) {
		const line = lines[index];
		if (line === void 0) continue;
		if ((line.type === "start" || line.type === "review") && line.fingerprint) baseline = line.fingerprint;
	}
	return baseline;
};
const stopHook = (root, payload, ctx) => {
	if (payload.stop_hook_active === true) return null;
	const sessionId = payload.session_id ?? "";
	const lines = readSessionLog(root, sessionId);
	pruneSessions(root);
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const sessionSkills = unique(lines.flatMap((line) => {
		return "skills" in line && line.type === "tool" ? line.skills : [];
	}));
	if (sessionSkills.includes("harness-curate")) recordCuratorRun(root, today);
	foldSkillUsage(root, sessionSkills, today);
	const onboarded = lines.some((line) => {
		return line.type === "tool" && line.onboarded === true;
	});
	if (existsSync(join(root, ".harness/BOOTSTRAP.md")) && !onboarded) return { hookSpecificOutput: {
		hookEventName: "Stop",
		additionalContext: ONBOARDING_ASK
	} };
	const { config } = readConfig(root);
	const minToolCalls = config.review.minToolCalls;
	if (minToolCalls !== void 0) {
		const lastReviewIndex = lines.findLastIndex((line) => {
			return line.type === "review";
		});
		{
			const prefix = lastReviewIndex === -1 ? lines : lines.slice(0, lastReviewIndex + 1);
			const baseline = reviewBaseline(prefix, prefix.length - 1);
			const afterReview = lines.slice(lastReviewIndex + 1);
			const calls = afterReview.filter((line) => {
				return line.type === "tool";
			}).length;
			const failures = afterReview.some((line) => {
				return line.type === "fail";
			});
			if ((ctx.fingerprintFailed || baseline !== null && ctx.fingerprint !== null && ctx.fingerprint !== baseline) && calls >= minToolCalls || failures) {
				appendSessionEvent(root, sessionId, {
					type: "review",
					at: (/* @__PURE__ */ new Date()).toISOString(),
					fingerprint: ctx.fingerprint
				});
				return { hookSpecificOutput: {
					hookEventName: "Stop",
					additionalContext: REVIEW_ASK
				} };
			}
		}
	}
	const { minLearnedSkills, intervalDays } = config.curator;
	const lastRun = lastCuratorRun(root);
	const daysSinceRun = lastRun === null ? null : dayDiff(lastRun, today);
	if (minLearnedSkills !== void 0 && intervalDays !== void 0) {
		const intervalDue = learnedSkillNames(root).length >= minLearnedSkills && (daysSinceRun === null || daysSinceRun >= intervalDays);
		const maxChars = config.memory.maxChars;
		const sizeDue = maxChars !== void 0 && memoryNearCap(readMemoryState(root).size, maxChars) && (daysSinceRun === null || daysSinceRun >= 1);
		if (intervalDue || sizeDue) return { hookSpecificOutput: {
			hookEventName: "Stop",
			additionalContext: CURATION_ASK
		} };
	}
	return null;
};

//#endregion
//#region src/core/constants/buffer.constant.ts
/** Node's default execFile buffer is 1 MiB, which truncates a large diff or a large file. */
const MAX_BUFFER_BYTES = 67108864;

//#endregion
//#region src/core/utils/run-command.util.ts
const execFileAsync = promisify(execFile);
const exitCodeOf = (failure) => {
	return typeof failure.code === "number" ? failure.code : null;
};
const feedLines = (buffer, chunk, onLine) => {
	const parts = (buffer + chunk).split(/\r\n|\n|\r/);
	const rest = parts.pop() ?? "";
	for (const line of parts) if (line !== "") onLine(line);
	return rest;
};
const runStreamed = async (file, args, cwd, onLine) => {
	return new Promise((resolve) => {
		const child = spawn(file, [...args], {
			cwd,
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		let stdout = "";
		let stderr = "";
		let stdoutBuffer = "";
		let stderrBuffer = "";
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (text) => {
			stdout += text;
			stdoutBuffer = feedLines(stdoutBuffer, text, onLine);
		});
		child.stderr.on("data", (text) => {
			stderr += text;
			stderrBuffer = feedLines(stderrBuffer, text, onLine);
		});
		child.on("error", (failure) => {
			resolve({
				code: exitCodeOf(failure),
				stdout,
				stderr
			});
		});
		child.on("close", (code) => {
			if (stdoutBuffer !== "") onLine(stdoutBuffer);
			if (stderrBuffer !== "") onLine(stderrBuffer);
			resolve({
				code: code ?? null,
				stdout,
				stderr
			});
		});
	});
};
const runCommand = async (file, args, options = {}) => {
	if (options.onLine) return runStreamed(file, args, options.cwd, options.onLine);
	try {
		const { stdout, stderr } = await execFileAsync(file, [...args], {
			cwd: options.cwd,
			encoding: "utf8",
			maxBuffer: MAX_BUFFER_BYTES
		});
		return {
			code: 0,
			stdout: stdout ?? "",
			stderr: stderr ?? ""
		};
	} catch (error) {
		const failure = error;
		return {
			code: exitCodeOf(failure),
			stdout: failure.stdout ?? "",
			stderr: failure.stderr ?? ""
		};
	}
};

//#endregion
//#region src/core/adapters/git.adapter.ts
const gitTopLevel = async (cwd) => {
	const result = await runCommand("git", ["rev-parse", "--show-toplevel"], { cwd });
	return result.code === 0 ? result.stdout.trim() : null;
};
const failureOf = (what, result) => {
	const detail = result.stderr.trim();
	return detail === "" ? `${what} failed with exit code ${result.code}` : `${what} failed: ${detail}`;
};
const gitWorktreeChanges = async (cwd) => {
	if (await gitTopLevel(cwd) === null) return { kind: "missing" };
	const status = await runCommand("git", [
		"status",
		"--porcelain=v1",
		"-z",
		"--untracked-files=all"
	], { cwd });
	if (status.code !== 0) return {
		kind: "failed",
		problem: failureOf("git status", status)
	};
	const diff = await runCommand("git", [
		"diff",
		"HEAD",
		"--no-ext-diff"
	], { cwd });
	if (diff.code !== 0) {
		if ((await runCommand("git", [
			"rev-parse",
			"--verify",
			"--quiet",
			"HEAD"
		], { cwd })).code !== 0) return {
			kind: "ok",
			status: status.stdout,
			diff: ""
		};
		return {
			kind: "failed",
			problem: failureOf("git diff", diff)
		};
	}
	return {
		kind: "ok",
		status: status.stdout,
		diff: diff.stdout
	};
};

//#endregion
//#region src/modules/harness/services/fingerprint.service.ts
const worktreeFingerprint = async (root) => {
	const changes = await gitWorktreeChanges(root);
	if (changes.kind === "missing") return {
		hash: null,
		failed: false
	};
	if (changes.kind === "failed") {
		logHookError(root, `the worktree fingerprint failed: ${changes.problem}`);
		return {
			hash: null,
			failed: true
		};
	}
	return {
		hash: createHash("sha256").update(changes.status).update(changes.diff).digest("hex"),
		failed: false
	};
};

//#endregion
//#region src/modules/harness/services/dispatcher.service.ts
const FINGERPRINT_EVENTS = /* @__PURE__ */ new Set(["SessionStart", "Stop"]);
const HANDLERS = {
	SessionStart: sessionStartHook,
	PostToolUse: toolLogHook,
	PostToolUseFailure: postToolUseFailureHook,
	Stop: stopHook
};
const MODE_HANDLERS = { "memory-guard": { PostToolUse: memoryGuardHook } };
const fingerprintContext = async (root) => {
	const { hash, failed } = await worktreeFingerprint(root);
	return {
		fingerprint: hash,
		fingerprintFailed: failed
	};
};
const runHook = async (root, raw, mode = "") => {
	const payload = JSON.parse(raw);
	const event = payload.hook_event_name ?? "";
	const handler = (MODE_HANDLERS[mode] ?? HANDLERS)[event];
	if (handler === void 0) return null;
	return handler(root, payload, FINGERPRINT_EVENTS.has(event) ? await fingerprintContext(root) : {
		fingerprint: null,
		fingerprintFailed: false
	});
};

//#endregion
//#region src/modules/harness/harness-hook.entry.ts
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
try {
	const raw = readFileSync(0, "utf8");
	const result = await runHook(root, raw, process.argv[2] ?? "");
	if (result !== null) process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
	logHookError(root, error instanceof Error ? error.message : String(error));
}
process.exitCode = 0;

//#endregion
export {  };