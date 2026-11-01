import { HOOK_COMMAND } from './harness-paths.constant';

export type HookSettingEntry = {
	event: string;
	matcher: string | null;
	command: string;
	async: boolean;
};

export const hookCommand = HOOK_COMMAND;
export const memoryGuardCommand = `${HOOK_COMMAND} memory-guard`;

export const hookSettingEntries: readonly HookSettingEntry[] = [
	{
		event: 'SessionStart',
		matcher: 'startup|resume|clear|compact',
		command: hookCommand,
		async: false
	},
	{
		event: 'PostToolUse',
		matcher: 'Write|Edit|MultiEdit',
		command: memoryGuardCommand,
		async: false
	},
	{
		event: 'PostToolUse',
		matcher: null,
		command: hookCommand,
		async: true
	},
	{
		event: 'PostToolUseFailure',
		matcher: null,
		command: hookCommand,
		async: true
	},
	{
		event: 'Stop',
		matcher: null,
		command: hookCommand,
		async: false
	}
];
