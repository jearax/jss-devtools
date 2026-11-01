import { existsSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { readConfig } from '@/modules/harness/config.service';
import { MEMORY_GUARD_TOOLS } from '@/modules/harness/constants/harness-limits.constant';
import { CLAUDE_SKILLS_DIR, HARNESS_MEMORY } from '@/modules/harness/constants/harness-paths.constant';
import { memoryLimitProblems, readMemoryState } from '@/modules/harness/memory.service';
import { appendSessionEvent } from '@/modules/harness/session-log.service';

import type { HookContext, HookPayload, HookResult } from '@/modules/harness/types/hook.type';

const SKILL_REF = /skills\/([A-Za-z0-9_-]+)\/SKILL\.md/g;

const realPathOr = (path: string): string => {
	try {
		return realpathSync(path);
	} catch {
		return resolve(path);
	}
};

const memoryFileOf = (root: string, toolInput: Record<string, unknown>): boolean => {
	const raw = typeof toolInput.file_path === 'string' ? toolInput.file_path : null;

	if (raw === null) {
		return false;
	}

	return realPathOr(raw) === realPathOr(join(root, HARNESS_MEMORY));
};

export const memoryGuardHook = (root: string, payload: HookPayload, _ctx: HookContext): HookResult | null => {
	const toolName = payload.tool_name ?? '';
	const toolInput = payload.tool_input ?? {};

	if (!MEMORY_GUARD_TOOLS.has(toolName) || !memoryFileOf(root, toolInput)) {
		return null;
	}

	const { config } = readConfig(root);
	const { maxChars, maxEntryChars } = config.memory;

	if (maxChars === undefined || maxEntryChars === undefined) {
		return null;
	}

	const problems = memoryLimitProblems(readMemoryState(root), maxChars, maxEntryChars);

	if (problems.length === 0) {
		return null;
	}

	return {
		decision: 'block',
		reason: `Memory limit broken: ${problems.join('; ')}`
	};
};

export const toolLogHook = (root: string, payload: HookPayload, _ctx: HookContext): HookResult | null => {
	if (payload.agent_id !== undefined) {
		return null;
	}

	const toolName = payload.tool_name ?? '';
	const toolInput = payload.tool_input ?? {};
	const skills: string[] = [];
	const command = typeof toolInput.command === 'string' ? toolInput.command : null;

	const skillRefCandidates = [toolInput.file_path, command].filter((candidate): candidate is string => {
		return typeof candidate === 'string';
	});

	for (const candidate of skillRefCandidates) {
		for (const match of candidate.matchAll(SKILL_REF)) {
			const name = match[1] ?? '';

			if (name !== '' && existsSync(join(root, CLAUDE_SKILLS_DIR, name, 'SKILL.md')) && !skills.includes(name)) {
				skills.push(name);
			}
		}
	}

	const skillArg = toolInput.skill;

	if (
		toolName === 'Skill' &&
		typeof skillArg === 'string' &&
		existsSync(join(root, CLAUDE_SKILLS_DIR, skillArg, 'SKILL.md')) &&
		!skills.includes(skillArg)
	) {
		skills.push(skillArg);
	}

	const onboarded = toolName === 'AskUserQuestion' && /onboard|bootstrap/i.test(JSON.stringify(toolInput));

	appendSessionEvent(root, payload.session_id ?? '', {
		type: 'tool',
		at: new Date().toISOString(),
		tool: toolName,
		skills,
		onboarded
	});

	return null;
};
