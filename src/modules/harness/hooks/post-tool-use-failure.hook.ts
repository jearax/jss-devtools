import { firstLine, redactLine } from '@/modules/harness/services/redaction.service';
import { appendSessionEvent } from '@/modules/harness/services/session-log.service';

import type { HookContext, HookPayload, HookResult } from '@/modules/harness/types/hook.type';

export const postToolUseFailureHook = (root: string, payload: HookPayload, _ctx: HookContext): HookResult | null => {
	if (payload.is_interrupt === true) {
		return null;
	}

	appendSessionEvent(root, payload.session_id ?? '', {
		type: 'fail',
		at: new Date().toISOString(),
		tool: payload.tool_name ?? '',
		error: redactLine(firstLine(payload.error ?? ''))
	});

	return null;
};
