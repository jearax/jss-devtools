import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readConfig } from '@/modules/harness/config.service';
import { CURATE_SIZE_COOLDOWN_DAYS } from '@/modules/harness/constants/harness-limits.constant';
import { HARNESS_BOOTSTRAP } from '@/modules/harness/constants/harness-paths.constant';
import { learnedSkillNames } from '@/modules/harness/learned-skills.service';
import { memoryNearCap, readMemoryState } from '@/modules/harness/memory.service';
import { appendSessionEvent, pruneSessions, readSessionLog } from '@/modules/harness/session-log.service';
import { dayDiff, foldSkillUsage, lastCuratorRun, recordCuratorRun } from '@/modules/harness/skill-usage.service';

import type { HookContext, HookPayload, HookResult } from '@/modules/harness/types/hook.type';

const unique = (names: readonly string[]): string[] => {
	return [...new Set(names)];
};

const ONBOARDING_ASK = 'Onboarding pending: .harness/BOOTSTRAP.md is present — run the harness-onboard skill.';
const REVIEW_ASK = 'A harness review is due: run the harness-review skill before you stop.';
const CURATION_ASK = 'Harness curation is due: run the harness-curate skill before you stop.';

type SessionEventLike = {
	type: string;
	fingerprint?: string | null;
	skills?: string[];
	onboarded?: boolean;
};

const reviewBaseline = (lines: readonly SessionEventLike[], uptoIndex: number): string | null => {
	let baseline: string | null = null;

	for (let index = 0; index <= uptoIndex; index += 1) {
		const line = lines[index];

		if (line === undefined) {
			continue;
		}

		if ((line.type === 'start' || line.type === 'review') && line.fingerprint) {
			baseline = line.fingerprint;
		}
	}

	return baseline;
};

export const stopHook = (root: string, payload: HookPayload, ctx: HookContext): HookResult | null => {
	if (payload.stop_hook_active === true) {
		return null;
	}

	const sessionId = payload.session_id ?? '';
	const lines = readSessionLog(root, sessionId);

	pruneSessions(root);

	const today = new Date().toISOString().slice(0, 10);

	const sessionSkills = unique(
		lines.flatMap((line) => {
			return 'skills' in line && line.type === 'tool' ? line.skills : [];
		})
	);

	if (sessionSkills.includes('harness-curate')) {
		recordCuratorRun(root, today);
	}

	foldSkillUsage(root, sessionSkills, today);

	const onboarded = lines.some((line) => {
		return line.type === 'tool' && line.onboarded === true;
	});

	const bootstrapPresent = existsSync(join(root, HARNESS_BOOTSTRAP));

	if (bootstrapPresent && !onboarded) {
		return {
			hookSpecificOutput: {
				hookEventName: 'Stop',
				additionalContext: ONBOARDING_ASK
			}
		};
	}

	const { config } = readConfig(root);
	const minToolCalls = config.review.minToolCalls;

	if (minToolCalls !== undefined) {
		const lastReviewIndex = lines.findLastIndex((line) => {
			return line.type === 'review';
		});

		{
			const prefix = lastReviewIndex === -1 ? lines : lines.slice(0, lastReviewIndex + 1);
			const baseline = reviewBaseline(prefix, prefix.length - 1);
			const afterReview = lines.slice(lastReviewIndex + 1);

			const calls = afterReview.filter((line) => {
				return line.type === 'tool';
			}).length;

			const failures = afterReview.some((line) => {
				return line.type === 'fail';
			});

			const treeChanged = baseline !== null && ctx.fingerprint !== null && ctx.fingerprint !== baseline;

			if ((treeChanged && calls >= minToolCalls) || failures) {
				appendSessionEvent(root, sessionId, {
					type: 'review',
					at: new Date().toISOString(),
					fingerprint: ctx.fingerprint
				});

				return {
					hookSpecificOutput: {
						hookEventName: 'Stop',
						additionalContext: REVIEW_ASK
					}
				};
			}
		}
	}

	const { minLearnedSkills, intervalDays } = config.curator;
	const lastRun = lastCuratorRun(root);
	const daysSinceRun = lastRun === null ? null : dayDiff(lastRun, today);

	if (minLearnedSkills !== undefined && intervalDays !== undefined) {
		const intervalDue =
			learnedSkillNames(root).length >= minLearnedSkills && (daysSinceRun === null || daysSinceRun >= intervalDays);

		const maxChars = config.memory.maxChars;

		const sizeDue =
			maxChars !== undefined &&
			memoryNearCap(readMemoryState(root).size, maxChars) &&
			(daysSinceRun === null || daysSinceRun >= CURATE_SIZE_COOLDOWN_DAYS);

		if (intervalDue || sizeDue) {
			return {
				hookSpecificOutput: {
					hookEventName: 'Stop',
					additionalContext: CURATION_ASK
				}
			};
		}
	}

	return null;
};
