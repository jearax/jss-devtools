import { HOOK_TIMEOUT_SECONDS } from './harness-limits.constant';
import { HOOK_COMMAND } from './harness-paths.constant';

export type HookSettingEntry = {
	event: string;
	matcher: string | null;
	command: string;
	async: boolean;
	timeout: number | null;
};

export const hookCommand = HOOK_COMMAND;
export const memoryGuardCommand = `${HOOK_COMMAND} memory-guard`;

export const hookSettingEntries: readonly HookSettingEntry[] = [
	{
		event: 'SessionStart',
		matcher: 'startup|resume|clear|compact',
		command: hookCommand,
		async: false,
		timeout: HOOK_TIMEOUT_SECONDS
	},
	{
		event: 'PostToolUse',
		matcher: 'Write|Edit|MultiEdit',
		command: memoryGuardCommand,
		async: false,
		timeout: HOOK_TIMEOUT_SECONDS
	},
	{
		event: 'PostToolUse',
		matcher: null,
		command: hookCommand,
		async: true,
		timeout: null
	},
	{
		event: 'PostToolUseFailure',
		matcher: null,
		command: hookCommand,
		async: true,
		timeout: null
	},
	{
		event: 'Stop',
		matcher: null,
		command: hookCommand,
		async: false,
		timeout: HOOK_TIMEOUT_SECONDS
	}
];
