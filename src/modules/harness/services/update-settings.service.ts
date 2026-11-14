import { CliError } from '@/core/errors/cli.error';
import { CLAUDE_SETTINGS, HOOK_SHIM_PATH } from '@/modules/harness/constants/harness-paths.constant';

import { buildHarnessHooks } from './merge.service';
import { readLiveFile } from './update-manifest.service';

import type { UpdateAction } from '@/modules/harness/types/update.type';

export const settingsAction = (cwd: string): UpdateAction | null => {
	const local = readLiveFile(cwd, CLAUDE_SETTINGS);
	let parsed: Record<string, unknown> = {};

	if (local !== null) {
		try {
			parsed = JSON.parse(local) as Record<string, unknown>;
		} catch (error) {
			throw new CliError(`Invalid JSON in ${CLAUDE_SETTINGS}: ${(error as Error).message}`, {
				hint: 'Fix it, then rerun'
			});
		}
	}

	const hooks = parsed['hooks'];
	const existing = typeof hooks === 'object' && hooks !== null ? (hooks as Record<string, unknown>) : {};

	const stripped: Record<string, unknown> = {};

	for (const [event, list] of Object.entries(existing)) {
		const items = Array.isArray(list) ? list : [];

		const kept = items.filter((item) => {
			const inner = (item as { hooks?: unknown })?.hooks;

			return !(Array.isArray(inner) ? inner : []).some((hook) => {
				const command = (hook as { command?: unknown })?.command;

				return typeof command === 'string' && command.includes(HOOK_SHIM_PATH);
			});
		});

		stripped[event] = kept;
	}

	const fresh = buildHarnessHooks();

	const result: Record<string, unknown> = {
		...parsed,
		hooks: { ...stripped }
	};

	const mergedHooks = result['hooks'] as Record<string, unknown>;

	for (const [event, additions] of Object.entries(fresh)) {
		mergedHooks[event] = [...((stripped[event] as unknown[]) ?? []), ...(additions as unknown[])];
	}

	const content = `${JSON.stringify(result, null, 2)}\n`;

	return content === local
		? null
		: {
				path: CLAUDE_SETTINGS,
				kind: 'update',
				reason: 'harness hook entries replaced',
				content
			};
};
