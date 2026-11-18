export type HookPayload = {
	hook_event_name?: string;
	session_id?: string;
	cwd?: string;
	source?: string;
	tool_name?: string;
	tool_input?: Record<string, unknown>;
	tool_use_id?: string;
	error?: string;
	is_interrupt?: boolean;
	stop_hook_active?: boolean;
	agent_id?: string;
};

export type HookContext = {
	fingerprint: string | null;
	fingerprintFailed: boolean;
};

export type HookResult = {
	decision?: 'block';
	reason?: string;
	hookSpecificOutput?: {
		hookEventName: 'SessionStart' | 'Stop';
		additionalContext: string;
	};
};

export type SessionEvent =
	| { type: 'start'; at: string; fingerprint: string | null }
	| {
			type: 'tool';
			at: string;
			tool: string;
			skills: string[];
			onboarded: boolean;
	  }
	| { type: 'fail'; at: string; tool: string; error: string }
	| { type: 'review'; at: string; fingerprint: string | null };

export type HarnessConfig = {
	review: { minToolCalls?: number };
	memory: { maxChars?: number; maxEntryChars?: number };
	curator: {
		minLearnedSkills?: number;
		intervalDays?: number;
		staleDays?: number;
		archiveDays?: number;
	};
};
