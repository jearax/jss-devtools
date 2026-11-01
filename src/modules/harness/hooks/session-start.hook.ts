import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_BOOTSTRAP } from '@/modules/harness/constants/harness-paths.constant';
import { readConfig } from '@/modules/harness/services/config.service';
import { decisionsInForce } from '@/modules/harness/services/decisions.service';
import { hookErrorsSinceLastSession } from '@/modules/harness/services/hook-errors.service';
import { indexDrift } from '@/modules/harness/services/index-drift.service';
import { memoryLimitProblems, memoryNearCap, readMemoryState } from '@/modules/harness/services/memory.service';
import { appendSessionEvent } from '@/modules/harness/services/session-log.service';

import type { HookContext, HookPayload, HookResult } from '@/modules/harness/types/hook.type';

const ONBOARDING_NOTICE = [
	'Onboarding is pending: `.harness/BOOTSTRAP.md` is present.',
	'Run the `harness-onboard` skill to seed the harness knowledge.'
].join(' ');

export const sessionStartHook = (root: string, payload: HookPayload, ctx: HookContext): HookResult | null => {
	const { config, problems } = readConfig(root);
	const warnings = [...problems];
	const sections: string[] = [];
	const memory = readMemoryState(root);
	const maxChars = config.memory.maxChars;

	if (memory.exists) {
		const overLimit =
			maxChars === undefined ? [] : memoryLimitProblems(memory, maxChars, config.memory.maxEntryChars ?? 0);

		sections.push(
			`# Harness memory (${memory.entries.length} entries, ${memory.size}/${maxChars ?? '?'} chars)\n${memory.text}`
		);
		warnings.push(...overLimit);
	} else {
		warnings.push('MEMORY.md is missing');
	}

	if (maxChars !== undefined && memory.exists && memoryNearCap(memory.size, maxChars)) {
		warnings.push(
			`MEMORY.md is at ${Math.round((memory.size / maxChars) * 100)}% of its ${maxChars} char limit — run the harness-curate skill`
		);
	}

	if (existsSync(join(root, HARNESS_BOOTSTRAP))) {
		sections.push(`## Onboarding\n${ONBOARDING_NOTICE}`);
	}

	const decisions = decisionsInForce(root);

	if (decisions.length > 0) {
		const lines = decisions.map((item) => {
			return `- ${item.id} ${item.title}`;
		});

		sections.push(`## Decisions in force\n${lines.join('\n')}`);
	}

	for (const drift of indexDrift(root)) {
		warnings.push(drift);
	}

	for (const error of hookErrorsSinceLastSession(root)) {
		warnings.push(`the hook error log recorded: ${error}`);
	}

	appendSessionEvent(root, payload.session_id ?? '', {
		type: 'start',
		at: new Date().toISOString(),
		fingerprint: ctx.fingerprint
	});

	const additionalContext =
		sections.join('\n\n') +
		(warnings.length === 0
			? ''
			: `\n\n## Warnings\n${warnings
					.map((w) => {
						return `- ${w}`;
					})
					.join('\n')}`);

	if (additionalContext.trim() === '') {
		return null;
	}

	return {
		hookSpecificOutput: {
			hookEventName: 'SessionStart',
			additionalContext
		}
	};
};
