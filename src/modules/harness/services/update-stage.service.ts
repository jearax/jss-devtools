import { stageConflicts, stagedInputsOf } from './staging.service';
import { readBaseCopy, readLiveFile } from './update-manifest.service';

import type { HarnessRelease, UpdatePlan, UpdateSession } from '@/modules/harness/types/update.type';

export const stageConflictedUpdate = (
	cwd: string,
	fromVersion: string,
	plan: UpdatePlan,
	release: HarnessRelease
): void => {
	const conflicts = plan.conflicts.map((conflict) => {
		const entry = release.files.find((file) => {
			return file.path === conflict.path;
		});

		return {
			path: conflict.path,
			kind: entry?.kind ?? 'managed',
			reason: conflict.reason
		};
	});

	const proposalByPath = new Map(
		plan.conflicts.map((conflict) => {
			return [conflict.path, conflict.content ?? null];
		})
	);

	const session: UpdateSession = {
		schema: 1,
		from: fromVersion,
		to: release.version,
		conflicts,
		plan: plan.actions
	};

	const inputs = stagedInputsOf(conflicts, {
		base: (path) => {
			return readBaseCopy(cwd, path);
		},
		local: (path) => {
			return readLiveFile(cwd, path);
		},
		upstream: (path) => {
			return (
				release.files.find((file) => {
					return file.path === path;
				})?.content ?? null
			);
		},
		proposal: (path) => {
			return proposalByPath.get(path) ?? null;
		}
	});

	stageConflicts(cwd, session, inputs);
};
