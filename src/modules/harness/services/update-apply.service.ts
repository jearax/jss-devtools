import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';

import { harnessBaseEntriesOf, harnessManifestOf } from './install-plan.service';

import type { HarnessRelease, UpdateAction } from '@/modules/harness/types/update.type';

export const applyUpdatePlan = (cwd: string, actions: readonly UpdateAction[], release: HarnessRelease): void => {
	for (const action of actions) {
		const full = join(cwd, action.path);

		if (action.kind === 'delete') {
			rmSync(full);

			continue;
		}

		mkdirSync(dirname(full), {
			recursive: true
		});

		writeFileSync(full, action.content ?? '');
	}

	const recorded = release.files;

	writeFileSync(join(cwd, HARNESS_MANIFEST), harnessManifestOf(recorded, release.version));

	for (const entry of harnessBaseEntriesOf(recorded)) {
		const target = join(cwd, entry.path);

		mkdirSync(dirname(target), {
			recursive: true
		});

		writeFileSync(target, entry.content);
	}
};
