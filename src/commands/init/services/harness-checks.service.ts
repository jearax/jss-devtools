import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { CliError } from '@/core/errors/cli.error';
import {
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	CLAUDE_SKILLS_DIR,
	HARNESS_BLOCK_BEGIN,
	HARNESS_DECISIONS_DIR,
	HARNESS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_MEMORY,
	HARNESS_PLANS_DIR,
	HARNESS_STATE_DIR,
	HARNESS_TEMPLATES_DIR,
	HOOK_SHIM_PATH
} from '@/modules/harness/constants/harness-paths.constant';
import { pathSafetyOf } from '@/modules/harness/services/path-safety.service';

// The harness entries init plans to write; a symlink in the way would be written through.
const HARNESS_INIT_ENTRIES = [
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	HARNESS_DIR,
	HARNESS_MEMORY,
	HARNESS_DECISIONS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_PLANS_DIR,
	HARNESS_TEMPLATES_DIR,
	HARNESS_STATE_DIR,
	`${CLAUDE_SKILLS_DIR}/harness-onboard`,
	`${CLAUDE_SKILLS_DIR}/harness-review`,
	`${CLAUDE_SKILLS_DIR}/harness-curate`
];

export const ensureSafeHarnessEntries = (cwd: string): void => {
	for (const name of HARNESS_INIT_ENTRIES) {
		const safety = pathSafetyOf(cwd, name);

		if (!safety.safe && existsSync(join(cwd, name))) {
			throw new CliError(`${name} ${safety.reason}`, {
				hint: 'Replace it with a real file or folder, then rerun'
			});
		}
	}
};

export const ensureSettingsJsonParses = (cwd: string): void => {
	const full = join(cwd, CLAUDE_SETTINGS);

	if (!existsSync(full)) {
		return;
	}

	try {
		JSON.parse(readFileSync(full, 'utf8'));
	} catch (error) {
		throw new CliError(`Invalid JSON in ${CLAUDE_SETTINGS}: ${(error as Error).message}`, {
			hint: 'Fix it, then rerun'
		});
	}
};

export const harnessConflicts = (cwd: string): readonly string[] => {
	const found: string[] = [];

	if (existsSync(join(cwd, HARNESS_DIR))) {
		found.push(`${HARNESS_DIR}/`);
	}

	if (existsSync(join(cwd, CLAUDE_SKILLS_DIR))) {
		for (const entry of readdirSync(join(cwd, CLAUDE_SKILLS_DIR))) {
			if (entry.startsWith('harness-')) {
				found.push(`${CLAUDE_SKILLS_DIR}/${entry}/`);
			}
		}
	}

	const claudeMdPath = join(cwd, CLAUDE_MD);

	if (existsSync(claudeMdPath) && readFileSync(claudeMdPath, 'utf8').includes(HARNESS_BLOCK_BEGIN)) {
		found.push(`the harness block in ${CLAUDE_MD}`);
	}

	const settingsPath = join(cwd, CLAUDE_SETTINGS);

	if (existsSync(settingsPath) && readFileSync(settingsPath, 'utf8').includes(HOOK_SHIM_PATH)) {
		found.push(`harness hooks in ${CLAUDE_SETTINGS}`);
	}

	return found;
};
