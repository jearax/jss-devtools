export const HARNESS_DIR = '.harness';
export const HARNESS_MEMORY = `${HARNESS_DIR}/MEMORY.md`;
export const HARNESS_BOOTSTRAP = `${HARNESS_DIR}/BOOTSTRAP.md`;
export const HARNESS_CONFIG = `${HARNESS_DIR}/config.json`;
export const HARNESS_CURATOR = `${HARNESS_DIR}/curator.json`;
export const HARNESS_DECISIONS_DIR = `${HARNESS_DIR}/decisions`;
export const HARNESS_DOCS_DIR = `${HARNESS_DIR}/docs`;
export const HARNESS_PLANS_DIR = `${HARNESS_DIR}/plans`;
export const HARNESS_STATE_DIR = `${HARNESS_DIR}/state`;
export const HARNESS_ARCHIVE_DIR = `${HARNESS_DIR}/archive`;
export const HARNESS_SESSIONS_DIR = `${HARNESS_STATE_DIR}/sessions`;
export const HARNESS_ERROR_LOG = `${HARNESS_STATE_DIR}/hook-errors.log`;
export const HARNESS_ERROR_CURSOR = `${HARNESS_STATE_DIR}/hook-errors.cursor`;
export const HARNESS_SKILL_USAGE = `${HARNESS_STATE_DIR}/skill-usage.json`;
export const HARNESS_MANIFEST = `${HARNESS_DIR}/core/manifest.json`;
export const HARNESS_BASE_DIR = `${HARNESS_DIR}/core/base`;
export const HARNESS_UPDATE_DIR = `${HARNESS_DIR}/update`;
export const HARNESS_UPDATE_LOCK = `${HARNESS_UPDATE_DIR}/.lock`;
export const HARNESS_UPDATE_SESSION = `${HARNESS_UPDATE_DIR}/session.json`;
export const HARNESS_TEMPLATES_DIR = `${HARNESS_DIR}/templates`;
export const CLAUDE_MD = 'CLAUDE.md';
export const CLAUDE_SETTINGS = '.claude/settings.json';
export const CLAUDE_SKILLS_DIR = '.claude/skills';
export const AGENT_KIT_CONFIG = '.agentkit/config.yaml';
export const HARNESS_BLOCK_BEGIN = '<!-- HARNESS:BEGIN -->';
export const HARNESS_BLOCK_END = '<!-- HARNESS:END -->';
// The paths that hold harness knowledge; the ignore templates and the seeding read this list.
export const KNOWLEDGE_PATHS = [
	HARNESS_MEMORY,
	HARNESS_BOOTSTRAP,
	HARNESS_CURATOR,
	`${HARNESS_DECISIONS_DIR}/`,
	`${HARNESS_DOCS_DIR}/`,
	`${HARNESS_ARCHIVE_DIR}/`,
	`${HARNESS_PLANS_DIR}/`
];

export const HOOK_SHIM_PATH = `${HARNESS_DIR}/bin/harness-hook.mjs`;
export const HOOK_BUNDLE_PATH = `${HARNESS_DIR}/bin/hooks.mjs`;
export const HOOK_FILES = [HOOK_BUNDLE_PATH, HOOK_SHIM_PATH];
export const HOOK_COMMAND = `node "$CLAUDE_PROJECT_DIR/${HOOK_SHIM_PATH}"`;
