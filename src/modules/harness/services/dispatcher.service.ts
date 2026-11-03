import { postToolUseFailureHook } from '@/modules/harness/hooks/post-tool-use-failure.hook';
import { memoryGuardHook, toolLogHook } from '@/modules/harness/hooks/post-tool-use.hook';
import { sessionStartHook } from '@/modules/harness/hooks/session-start.hook';
import { stopHook } from '@/modules/harness/hooks/stop.hook';

import { worktreeFingerprint } from './fingerprint.service';

import type { HookContext, HookPayload, HookResult } from '@/modules/harness/types/hook.type';

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

const fingerprintContext = async (root: string): Promise<HookContext> => {
	const { hash, failed } = await worktreeFingerprint(root);

	return {
		fingerprint: hash,
		fingerprintFailed: failed
	};
};

export const runHook = async (root: string, raw: string, mode: string = ''): Promise<HookResult | null> => {
	const payload = JSON.parse(raw) as HookPayload;
	const event = payload.hook_event_name ?? '';
	const handler = (MODE_HANDLERS[mode] ?? HANDLERS)[event];

	if (handler === undefined) {
		return null;
	}

	const ctx: HookContext = FINGERPRINT_EVENTS.has(event)
		? await fingerprintContext(root)
		: {
				fingerprint: null,
				fingerprintFailed: false
			};

	return handler(root, payload, ctx);
};
