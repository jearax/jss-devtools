import { worktreeFingerprint } from './fingerprint.service';
import { postToolUseFailureHook } from './hooks/post-tool-use-failure.hook';
import { memoryGuardHook, toolLogHook } from './hooks/post-tool-use.hook';
import { sessionStartHook } from './hooks/session-start.hook';
import { stopHook } from './hooks/stop.hook';

import type { HookContext, HookPayload, HookResult } from './types/hook.type';

type Handler = (root: string, payload: HookPayload, ctx: HookContext) => HookResult | null;

const FINGERPRINT_EVENTS = new Set(['SessionStart', 'Stop']);

const HANDLERS: Record<string, Handler> = {
	SessionStart: sessionStartHook,
	PostToolUse: toolLogHook,
	PostToolUseFailure: postToolUseFailureHook,
	Stop: stopHook
};

const MODE_HANDLERS: Record<string, Record<string, Handler>> = {
	'memory-guard': { PostToolUse: memoryGuardHook }
};

export const runHook = async (root: string, raw: string, mode: string = ''): Promise<HookResult | null> => {
	const payload = JSON.parse(raw) as HookPayload;
	const event = payload.hook_event_name ?? '';
	const handler = (MODE_HANDLERS[mode] ?? HANDLERS)[event];

	if (handler === undefined) {
		return null;
	}

	const ctx: HookContext = {
		fingerprint: FINGERPRINT_EVENTS.has(event) ? await worktreeFingerprint(root) : null
	};

	return handler(root, payload, ctx);
};
