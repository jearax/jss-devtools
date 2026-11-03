import { HARNESS_BLOCK_BEGIN, HARNESS_BLOCK_END } from '@/modules/harness/constants/harness-paths.constant';
import { hookSettingEntries } from '@/modules/harness/constants/hook-settings.constant';

import type { HookSettingEntry } from '@/modules/harness/constants/hook-settings.constant';

const escapeRegExp = (text: string): string => {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const BLOCK_REGION = new RegExp(`${escapeRegExp(HARNESS_BLOCK_BEGIN)}[\\s\\S]*?${HARNESS_BLOCK_END}`);

const withOneBlankLine = (raw: string): string => {
	return `${raw.replace(/\n+$/, '')}\n\n`;
};

const blockFile = (block: string): string => {
	return `${block}\n`;
};

export const mergeHarnessBlock = (raw: string | null, block: string): string => {
	if (raw === null || raw.trim() === '') {
		return blockFile(block);
	}

	if (BLOCK_REGION.test(raw)) {
		return raw.replace(BLOCK_REGION, block);
	}

	return `${withOneBlankLine(raw)}${blockFile(block)}`;
};

type HooksObject = Record<string, unknown>;

const hookEntryOf = (entry: HookSettingEntry): Record<string, unknown> => {
	const handler: Record<string, unknown> = {
		type: 'command',
		command: entry.command,
		async: entry.async
	};

	if (entry.timeout !== null) {
		handler['timeout'] = entry.timeout;
	}

	return {
		matcher: entry.matcher === null ? undefined : entry.matcher,
		hooks: [handler]
	};
};

const eventGroups = (): HooksObject => {
	const groups: HooksObject = {};

	for (const entry of hookSettingEntries) {
		const list = groups[entry.event] as unknown[] | undefined;

		const raw = hookEntryOf(entry);

		const item =
			raw['matcher'] === undefined
				? { hooks: raw['hooks'] }
				: {
						matcher: raw['matcher'],
						hooks: raw['hooks']
					};

		if (list === undefined) {
			groups[entry.event] = [item];
		} else {
			list.push(item);
		}
	}

	return groups;
};

export const buildHarnessHooks = (): HooksObject => {
	return eventGroups();
};

const commandsOf = (list: unknown): Set<string> => {
	return new Set(
		(Array.isArray(list) ? list : []).flatMap((item) => {
			const hooks = (item as { hooks?: unknown })?.hooks;

			return (Array.isArray(hooks) ? hooks : []).flatMap((hook) => {
				const command = (hook as { command?: unknown })?.command;

				return typeof command === 'string' ? [command] : [];
			});
		})
	);
};

const handlersOf = (item: unknown): Record<string, unknown>[] => {
	const inner = (item as { hooks?: unknown })?.hooks;

	return (Array.isArray(inner) ? inner : []).filter((hook): hook is Record<string, unknown> => {
		return typeof hook === 'object' && hook !== null;
	});
};

// An entry the CLI already wrote keeps its place and takes the fields of the current release,
// so a settings.json written by an older release reaches the new shape without a full replace.
const refreshKnownHandlers = (current: readonly unknown[], additions: readonly unknown[]): void => {
	const fresh = additions.flatMap((item) => {
		return handlersOf(item);
	});

	for (const item of current) {
		for (const handler of handlersOf(item)) {
			const replacement = fresh.find((candidate) => {
				return candidate['command'] === handler['command'];
			});

			if (replacement === undefined) {
				continue;
			}

			for (const [key, value] of Object.entries(replacement)) {
				handler[key] = value;
			}
		}
	}
};

const mergeIntoSettings = (parsed: Record<string, unknown>, hooks: HooksObject): Record<string, unknown> => {
	const existing = parsed['hooks'];

	const existingHooks = typeof existing === 'object' && existing !== null ? (existing as HooksObject) : {};

	const merged: HooksObject = { ...existingHooks };

	for (const [event, additions] of Object.entries(hooks)) {
		const current = Array.isArray(merged[event]) ? (merged[event] as unknown[]) : [];
		const known = commandsOf(current);

		refreshKnownHandlers(current, additions as unknown[]);

		const fresh = (additions as unknown[]).filter((item) => {
			const commands = handlersOf(item).map((hook) => {
				return hook['command'];
			});

			return !commands.some((command) => {
				return typeof command === 'string' && known.has(command);
			});
		});

		merged[event] = [...current, ...fresh];
	}

	return {
		...parsed,
		hooks: merged
	};
};

export const missingHookEntries = (raw: string | null): readonly string[] => {
	let parsed: Record<string, unknown>;

	try {
		parsed = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
	} catch {
		return ['settings.json is not valid JSON'];
	}

	const missing: string[] = [];

	for (const entry of hookSettingEntries) {
		const list = parsed['hooks'];

		const items =
			typeof list === 'object' && list !== null && Array.isArray((list as HooksObject)[entry.event])
				? ((list as HooksObject)[entry.event] as unknown[])
				: [];

		const present = items.some((item) => {
			const inner = (item as { hooks?: unknown })?.hooks;

			return (Array.isArray(inner) ? inner : []).some((hook) => {
				const command = (hook as { command?: unknown })?.command;

				return typeof command === 'string' && command === entry.command;
			});
		});

		if (!present) {
			missing.push(`${entry.event}${entry.matcher === null ? '' : ` (${entry.matcher})`}`);
		}
	}

	return missing;
};

export const mergeHarnessSettings = (raw: string | null): string => {
	const hooks = buildHarnessHooks();

	if (raw === null) {
		return `${JSON.stringify({ hooks }, null, 2)}\n`;
	}

	const parsed = JSON.parse(raw) as Record<string, unknown>;

	return `${JSON.stringify(mergeIntoSettings(parsed, hooks), null, 2)}\n`;
};
