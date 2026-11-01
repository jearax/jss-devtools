import { firstLine, redactSecrets } from '@/modules/harness/redaction.service';
import { appendSessionEvent } from '@/modules/harness/session-log.service';

import type { HookContext, HookPayload, HookResult } from '@/modules/harness/types/hook.type';

export const postToolUseFailureHook = (root: string, payload: HookPayload, _ctx: HookContext): HookResult | null => {
	if (payload.is_interrupt === true) {
		return null;
	}

	appendSessionEvent(root, payload.session_id ?? '', {
		type: 'fail',
		at: new Date().toISOString(),
		tool: payload.tool_name ?? '',
		error: redactSecrets(firstLine(payload.error ?? ''))
	});

	return null;
};
