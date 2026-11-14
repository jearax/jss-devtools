import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

//#region src/modules/harness/constants/redaction-rules.constant.ts
const RULES = [
	{
		name: "openai-key",
		kind: "secret",
		pattern: /\bsk-[A-Za-z0-9_-]{8,}/g,
		replacement: "[redacted]"
	},
	{
		name: "aws-key",
		kind: "secret",
		pattern: /\bA[KS]IA[0-9A-Z]{16}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "bearer-token",
		kind: "secret",
		pattern: /\bBearer\s+\S+/gi,
		replacement: "[redacted]"
	},
	{
		name: "credential-assignment",
		kind: "secret",
		pattern: /\b(?:api[_-]?key|token|password|secret|authorization)["']?\s*[:=]\s*\S+/gi,
		replacement: "[redacted]"
	},
	{
		name: "github-token",
		kind: "secret",
		pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "github-fine-grained-token",
		kind: "secret",
		pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "slack-token",
		kind: "secret",
		pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "slack-app-token",
		kind: "secret",
		pattern: /\bxapp-[A-Za-z0-9-]{10,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "gitlab-token",
		kind: "secret",
		pattern: /\bglpat-[A-Za-z0-9_-]{15,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "npm-token",
		kind: "secret",
		pattern: /\bnpm_[A-Za-z0-9]{20,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "stripe-key",
		kind: "secret",
		pattern: /\b[sr]k_live_[A-Za-z0-9]{15,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "google-api-key",
		kind: "secret",
		pattern: /\bAIza[A-Za-z0-9_-]{30,}\b/g,
		replacement: "[redacted]"
	},
	{
		name: "jwt",
		kind: "secret",
		pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
		replacement: "[redacted]"
	},
	{
		name: "private-key-header",
		kind: "secret",
		pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
		replacement: "[redacted]"
	},
	{
		name: "url-credentials",
		kind: "secret",
		pattern: /\b[a-z][a-z0-9+.-]{0,15}:\/\/[^\s:@/]{1,64}:[^\s@/]{1,128}@[^\s/]{1,255}/g,
		replacement: "[redacted]"
	},
	{
		name: "home-path",
		kind: "private",
		pattern: /(?:\/Users\/|\/home\/|C:\\Users\\)[A-Za-z0-9._-]+(?:\/|\\)/g,
		replacement: "~/"
	},
	{
		name: "encoded-home-path",
		kind: "private",
		pattern: /(?<![A-Za-z0-9-])(?:[A-Z]-)?-(?:Users|home)-[A-Za-z0-9._]{1,32}-/g,
		replacement: "-Users-<account>-"
	},
	{
		name: "email",
		kind: "private",
		pattern: /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}/g,
		replacement: "[redacted]"
	}
];
const REDACTION_RULES = RULES;
const EXEMPT_ACCOUNTS = /* @__PURE__ */ new Set([
	"<name>",
	"name",
	"user",
	"username",
	"you",
	"me",
	"tester",
	"node",
	"runner",
	"ubuntu",
	"Shared"
]);
const EXEMPT_EMAIL_DOMAINS = /* @__PURE__ */ new Set([
	"example.com",
	"example.org",
	"example.net",
	"example.test"
]);
const EXEMPT_EMAIL_LOCAL_AT_DOMAINS = /* @__PURE__ */ new Set([
	"git@github.com",
	"git@gitlab.com",
	"git@bitbucket.org"
]);
const IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"webp",
	"svg",
	"ico",
	"avif"
]);

//#endregion
//#region src/modules/harness/services/redaction.service.ts
const exemptEmail = (value) => {
	const lowered = value.toLowerCase();
	if (EXEMPT_EMAIL_LOCAL_AT_DOMAINS.has(lowered)) return true;
	const domain = lowered.slice(lowered.lastIndexOf("@") + 1);
	if (EXEMPT_EMAIL_DOMAINS.has(domain)) return true;
	const lastLabel = domain.split(".").pop() ?? "";
	return IMAGE_EXTENSIONS.has(lastLabel);
};
const isExempt = (rule, value) => {
	if (rule.name === "home-path") {
		const parts = value.split(/[/\\]/).filter((part) => {
			return part !== "";
		});
		return parts.length >= 2 && parts[1] !== void 0 && EXEMPT_ACCOUNTS.has(parts[1]);
	}
	if (rule.name === "email") return exemptEmail(value);
	if (rule.name === "encoded-home-path") {
		const account = /-(?:Users|home)-([A-Za-z0-9._]{1,32})-$/.exec(value)?.[1];
		return account !== void 0 && EXEMPT_ACCOUNTS.has(account);
	}
	return false;
};
const redactLine = (text) => {
	return REDACTION_RULES.reduce((acc, rule) => {
		return acc.replace(rule.pattern, (value) => {
			return isExempt(rule, value) ? value : rule.replacement;
		});
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
const HARNESS_PLANS_DIR = `${HARNESS_DIR}/plans`;
const HARNESS_STATE_DIR = `${HARNESS_DIR}/state`;
const HARNESS_SESSIONS_DIR = `${HARNESS_STATE_DIR}/sessions`;
const HARNESS_ERROR_LOG = `${HARNESS_STATE_DIR}/hook-errors.log`;
const HARNESS_ERROR_CURSOR = `${HARNESS_STATE_DIR}/hook-errors.cursor`;
const HARNESS_SKILL_USAGE = `${HARNESS_STATE_DIR}/skill-usage.json`;
const HARNESS_BASE_DIR = `${HARNESS_DIR}/core/base`;
const CLAUDE_SKILLS_DIR = ".claude/skills";
const AGENT_KIT_CONFIG = ".agentkit/config.yaml";

//#endregion
//#region src/modules/harness/services/path-safety.service.ts
const textReasonOf = (root, path) => {
	if (path === "" || isAbsolute(path)) return "is an absolute path";
	if (path.split(/[/\\]/).includes("..")) return "contains a \"..\" segment";
	const base = resolve(root);
	return resolve(base, path).startsWith(base + sep) ? null : "is outside the repository";
};
/**
* Answers whether a repository-relative path is safe to read or write: it passes the textual
* check, no existing component below the root is a symlink, and the real path of its deepest
* existing ancestor stays inside the real root (the root itself may sit behind a symlink).
*/
const pathSafetyOf = (root, path) => {
	const textual = textReasonOf(root, path);
	if (textual !== null) return {
		safe: false,
		reason: textual
	};
	const rootAbsolute = resolve(root);
	const relative = resolve(rootAbsolute, path).slice(rootAbsolute.length + 1);
	let deepest = rootAbsolute;
	for (const segment of relative.split(sep)) {
		const candidate = join(deepest, segment);
		let stats;
		try {
			stats = lstatSync(candidate);
		} catch {
			break;
		}
		if (stats.isSymbolicLink()) return {
			safe: false,
			reason: "is a symlink"
		};
		deepest = candidate;
	}
	const realRoot = realpathSync(rootAbsolute);
	const realDeepest = realpathSync(deepest);
	if (realDeepest !== realRoot && !realDeepest.startsWith(realRoot + sep)) return {
		safe: false,
		reason: "resolves outside the repository"
	};
	return {
		safe: true,
		reason: null
	};
};
const isSafePath = (root, path) => {
	return pathSafetyOf(root, path).safe;
};
/** An unsafe or missing file reads as `null`; the hooks skip it as if it were missing. */
const safeReadFile = (root, path) => {
	if (!isSafePath(root, path)) return null;
	const full = join(root, path);
	return existsSync(full) ? readFileSync(full, "utf8") : null;
};
/** An unsafe file is not written; the caller decides whether that is an error. */
const safeWriteFile = (root, path, content) => {
	if (!isSafePath(root, path)) return false;
	const full = join(root, path);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, content);
	return true;
};

//#endregion
//#region src/modules/harness/services/session-log.service.ts
const sessionIdOf = (raw) => {
	return raw.replace(/[^A-Za-z0-9_-]/g, "_") || "unknown";
};
const logPath = (root, sessionId) => {
	return join(root, HARNESS_SESSIONS_DIR, `${sessionIdOf(sessionId)}.jsonl`);
};
const appendSessionEvent = (root, sessionId, event) => {
	const relative = `${HARNESS_SESSIONS_DIR}/${sessionIdOf(sessionId)}.jsonl`;
	if (!isSafePath(root, relative)) return;
	const path = logPath(root, sessionId);
	mkdirSync(join(root, HARNESS_SESSIONS_DIR), { recursive: true });
	writeFileSync(path, `${JSON.stringify(event)}\n`, { flag: "a" });
};
const readSessionLog = (root, sessionId) => {
	const text = safeReadFile(root, `${HARNESS_SESSIONS_DIR}/${sessionIdOf(sessionId)}.jsonl`);
	if (text === null) return [];
	return text.split("\n").filter((line) => {
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
		error: redactLine(firstLine(payload.error ?? ""))
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
	},
	knowledge: { share: false }
};

//#endregion
//#region src/modules/harness/services/config.service.ts
const EMPTY_CONFIG = {
	review: {},
	memory: {},
	curator: {},
	knowledge: {}
};
const REPAIR_HINT = "run \"jss-devtools harness update\" to restore the default keys";
const NUMBER_KEYS = Object.keys(HARNESS_CONFIG_DEFAULTS).flatMap((group) => {
	return Object.entries(HARNESS_CONFIG_DEFAULTS[group]).filter(([, value]) => {
		return typeof value === "number";
	}).map(([key]) => {
		return [group, key];
	});
});
const BOOLEAN_KEYS = Object.keys(HARNESS_CONFIG_DEFAULTS).flatMap((group) => {
	return Object.entries(HARNESS_CONFIG_DEFAULTS[group]).filter(([, value]) => {
		return typeof value === "boolean";
	}).map(([key]) => {
		return [group, key];
	});
});
const groupOf$1 = (config, group) => {
	const value = config?.[group];
	return typeof value === "object" && value !== null ? value : {};
};
const readConfig = (root) => {
	const problems = [];
	let parsed = null;
	const raw = safeReadFile(root, HARNESS_CONFIG);
	if (raw === null) problems.push(`config.json is missing — ${REPAIR_HINT}`);
	else try {
		parsed = JSON.parse(raw);
	} catch {
		problems.push(`config.json is not valid JSON — ${REPAIR_HINT}`);
		parsed = null;
	}
	const config = Object.fromEntries(Object.keys(EMPTY_CONFIG).map((group) => {
		return [group, {}];
	}));
	for (const [group, key] of NUMBER_KEYS) {
		const value = groupOf$1(parsed, group)[key];
		if (typeof value === "number" && Number.isFinite(value)) config[group][key] = value;
		else problems.push(`config.json is missing a usable "${group}.${key}" — ${REPAIR_HINT}`);
	}
	for (const [group, key] of BOOLEAN_KEYS) {
		const value = groupOf$1(parsed, group)[key];
		if (typeof value === "boolean") config[group][key] = value;
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
	const text = safeReadFile(root, HARNESS_MEMORY);
	if (text === null) return EMPTY_MEMORY;
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
//#region src/modules/harness/services/agent-kit.service.ts
const usesAgentKit = (root) => {
	return existsSync(join(root, AGENT_KIT_CONFIG));
};

//#endregion
//#region src/modules/harness/services/config-merge.service.ts
const groupOf = (config, name) => {
	const value = config?.[name];
	return typeof value === "object" && value !== null ? value : null;
};
const resolveKnowledgeShare = (baseRaw, localRaw) => {
	try {
		const local = JSON.parse(localRaw);
		const live = groupOf(local, "knowledge")?.["share"];
		if (typeof live === "boolean") return live;
		const base = baseRaw === null ? null : JSON.parse(baseRaw);
		const baseValue = base === null ? void 0 : groupOf(base, "knowledge")?.["share"];
		return typeof baseValue === "boolean" ? baseValue : true;
	} catch {
		return true;
	}
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
	return decisionFileNames(root).map((name) => {
		const text = safeReadFile(root, `${".harness/decisions"}/${name}`) ?? "";
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
//#region src/modules/harness/services/health-symlinks.service.ts
const SYMLINK_CHECKS = [
	HARNESS_DIR,
	HARNESS_MEMORY,
	HARNESS_BOOTSTRAP,
	HARNESS_CONFIG,
	HARNESS_CURATOR,
	HARNESS_DECISIONS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_STATE_DIR,
	CLAUDE_SKILLS_DIR
];
const unsafeSymlinkPaths = (root) => {
	return SYMLINK_CHECKS.flatMap((path) => {
		return pathSafetyOf(root, path).safe ? [] : [path];
	});
};
const symlinkWarnings = (root) => {
	return unsafeSymlinkPaths(root).map((path) => {
		return `${path} is a symlink; the harness does not read or write through symlinks`;
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
	if (!existsSync(cursorPath) || !isSafePath(root, ".harness/state/hook-errors.cursor")) return;
	const cursor = Number(readFileSync(cursorPath, "utf8").trim() || "0");
	writeFileSync(cursorPath, String(Math.max(0, cursor - removed)));
};
const logHookError = (root, detail) => {
	try {
		if (!isSafePath(root, ".harness/state/hook-errors.log")) return;
		const dir = join(root, HARNESS_STATE_DIR);
		mkdirSync(dir, { recursive: true });
		const path = join(root, HARNESS_ERROR_LOG);
		const line = `${(/* @__PURE__ */ new Date()).toISOString()} ${redactLine(detail.replace(/\s+/g, " ").slice(0, 400))}\n`;
		if (existsSync(path) && statSync(path).size + Buffer.byteLength(line) > 65536) shiftCursor(root, trimToNewestHalf(path));
		writeFileSync(path, line, { flag: "a" });
	} catch {
		return;
	}
};
const hookErrorsSinceLastSession = (root) => {
	const logPath = join(root, HARNESS_ERROR_LOG);
	if (!existsSync(logPath) || !isSafePath(root, ".harness/state/hook-errors.log")) return [];
	const cursorPath = join(root, HARNESS_ERROR_CURSOR);
	const buffer = readFileSync(logPath);
	const offset = existsSync(cursorPath) && isSafePath(root, ".harness/state/hook-errors.cursor") ? Number(readFileSync(cursorPath, "utf8").trim() || "0") : 0;
	const lines = buffer.subarray(offset > 0 && offset <= buffer.length ? offset : 0).toString("utf8").split("\n").filter((line) => {
		return line !== "";
	});
	if (!isSafePath(root, ".harness/state/hook-errors.cursor")) return lines;
	mkdirSync(join(root, HARNESS_STATE_DIR), { recursive: true });
	writeFileSync(cursorPath, String(buffer.length));
	return lines;
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
	const files = decisionFileIds(root);
	const readme = safeReadFile(root, `${HARNESS_DECISIONS_DIR}/README.md`);
	const rows = readme === null ? [] : decisionRows(readme);
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
	const files = readdirSync(dir).filter((name) => {
		return name.endsWith(".md") && name !== "README.md";
	}).map((name) => {
		return name.replace(/\.md$/, "");
	});
	const readme = safeReadFile(root, `${HARNESS_DOCS_DIR}/README.md`);
	const rows = readme === null ? [] : docRowNames(readme);
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
//#region src/modules/harness/templates/bootstrap.template.ts
const BOOTSTRAP_CREATE = `# Onboarding pending

The harness was just installed into a new project. Run the \`harness-onboard\` skill; it deletes
this file when onboarding is done.

1. Ask the user what the project is for and which conventions they already want, unless the
   session already says.
2. Record what they said: facts as memory lines, choices later work must follow as decisions
   quoting the user.\n`;
const BOOTSTRAP_EXISTING = `# Onboarding pending

The harness was just installed into a project that already has code. Run the \`harness-onboard\`
skill; it deletes this file when onboarding is done.

1. Read the README, the build, test and CI config, and the top-level layout.
2. Trace one real path end to end: entry point, core logic, its test.
3. Find how to build, test, lint and run, and what about it is not obvious.
4. Write \`.harness/docs/architecture.md\` from its template, its row in \`.harness/docs/README.md\`,
   and a memory line pointing to it.
5. Add the non-obvious facts to \`.harness/MEMORY.md\`, each with \`(src: path)\`.
6. Ask the user the policy questions the code cannot answer, and record the answers as decisions.\n`;
const harnessBootstrapTemplate = (mode) => {
	return mode === "create" ? BOOTSTRAP_CREATE : BOOTSTRAP_EXISTING;
};

//#endregion
//#region src/modules/harness/templates/harness-seeds.template.ts
const harnessMemoryTemplate = `# Memory

Short facts about this repository, injected at every session start. Size limits are in
\`.harness/config.json\` under \`memory\`.

- One \`- \` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: \`(src: path:line)\`.
- Longer than a line: write \`.harness/docs/<topic>.md\` and leave
  \`- <fact>. See .harness/docs/<topic>.md\`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.\n`;
const harnessDecisionsReadmeTemplate = `# Decisions

User decisions that later work must follow: the only product policy in this repository. Write one
from [\`../templates/decision.md\`](../templates/decision.md).

| #   | Title | Status | Date |
| --- | ----- | ------ | ---- |\n`;
const harnessDocsReadmeTemplate = `# Docs

Knowledge longer than one line of [\`../MEMORY.md\`](../MEMORY.md). Pick the template from
[\`../templates/README.md\`](../templates/README.md).

| Doc | Kind | Summary |
| --- | ---- | ------- |\n`;
const harnessPlansReadmeTemplate = (agentKit) => {
	if (agentKit === false) return `# Plans

Work that spans sessions. One file per plan; its folder is its state.

- \`active/<YYMMDD>-<slug>.md\`: in progress or blocked.
- \`completed/<YYMMDD>-<slug>.md\`: done, kept as a record, never rewritten.

Start from [\`../templates/plan.md\`](../templates/plan.md). When done, fill its Result and
\`git mv\` it to \`completed/\`. A user decision goes to \`../decisions/\`, lasting knowledge to
\`../docs/\` or \`../MEMORY.md\`.\n`;
	return `# Plans

Work that spans sessions. The plan skill that owns this folder decides the layout: a plan is a
folder with its plan and its phase files.

Keep this file the index of the folder: add or remove a row in the same change as the plan.

| Plan | Status | Summary |
| ---- | ------ | ------- |\n`;
};

//#endregion
//#region src/modules/harness/hooks/session-start.hook.ts
const ONBOARDING_NOTICE = ["Onboarding is pending: `.harness/BOOTSTRAP.md` is present.", "Run the `harness-onboard` skill to seed the harness knowledge."].join(" ");
const seedKnowledgeFiles = (root, memoryWasMissing) => {
	const agentKit = usesAgentKit(root);
	const seeds = [
		[HARNESS_MEMORY, harnessMemoryTemplate],
		[`${HARNESS_DECISIONS_DIR}/README.md`, harnessDecisionsReadmeTemplate],
		[`${HARNESS_DOCS_DIR}/README.md`, harnessDocsReadmeTemplate],
		[`${HARNESS_PLANS_DIR}/README.md`, harnessPlansReadmeTemplate(agentKit)]
	];
	if (memoryWasMissing) seeds.push([HARNESS_BOOTSTRAP, harnessBootstrapTemplate("existing")]);
	for (const [path, content] of seeds) {
		if (safeReadFile(root, path) !== null) continue;
		if (!safeWriteFile(root, path, content)) logHookError(root, `could not write the knowledge seed ${path}`);
	}
};
const sessionStartHook = (root, payload, ctx) => {
	const { config, problems } = readConfig(root);
	const warnings = [...problems, ...symlinkWarnings(root)];
	const sections = [];
	const shared = resolveKnowledgeShare(safeReadFile(root, `${HARNESS_BASE_DIR}/${HARNESS_CONFIG}`), safeReadFile(root, ".harness/config.json") ?? "{}");
	sections.push(shared ? "Harness knowledge: shared through git" : "Harness knowledge: private to this machine (gitignored)");
	if (config.knowledge.share === false) seedKnowledgeFiles(root, !existsSync(join(root, HARNESS_MEMORY)));
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
		return `- ${redactLine(w)}`;
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
		return entry.isDirectory() && !entry.isSymbolicLink();
	}).map((entry) => {
		return entry.name;
	}).filter((name) => {
		const skill = join(dir, name, "SKILL.md");
		return existsSync(skill) && /^\s*harness-origin:\s*learned$/m.test(readFileSync(skill, "utf8"));
	});
};

//#endregion
//#region src/modules/harness/services/skill-usage.service.ts
const writeJson = (root, name, data) => {
	if (!isSafePath(root, name)) return;
	const path = join(root, name);
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
const readJson = (root, name, label, fallback) => {
	const path = join(root, name);
	if (!existsSync(path) || !isSafePath(root, name)) return {
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
	const { value: usage, corrupt } = readJson(root, HARNESS_SKILL_USAGE, HARNESS_SKILL_USAGE, {});
	if (names.length === 0 && !corrupt) return usage;
	const merged = { ...usage };
	for (const name of names) {
		const current = merged[name];
		merged[name] = current === void 0 || current < today ? today : current;
	}
	writeJson(root, HARNESS_SKILL_USAGE, merged);
	return merged;
};
const lastCuratorRun = (root) => {
	const { value } = readJson(root, HARNESS_CURATOR, HARNESS_CURATOR, {});
	return typeof value.lastRun === "string" ? value.lastRun : null;
};
const recordCuratorRun = (root, day) => {
	writeJson(root, HARNESS_CURATOR, { lastRun: day });
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