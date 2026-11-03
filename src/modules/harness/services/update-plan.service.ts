import { CLAUDE_SETTINGS } from '@/modules/harness/constants/harness-paths.constant';

import { embedBlockUnit } from './block-region.service';
import { decideBlock, decideConfig, decideWholeFile, type PathContext } from './update-decide.service';
import { readBaseCopy, readLiveFile, manifestEntryOf, readManifest } from './update-manifest.service';
import { settingsAction } from './update-settings.service';

import type { HarnessRelease, UpdateAction, UpdatePlan, UpdateOverrides } from '@/modules/harness/types/update.type';

export const planHarnessUpdate = async (
	cwd: string,
	release: HarnessRelease,
	overrides?: UpdateOverrides
): Promise<UpdatePlan> => {
	const manifest = readManifest(cwd);

	const upstreamByPath = new Map(
		release.files.map((file) => {
			return [file.path, file.content];
		})
	);

	const seedByPath = new Map(
		(release.seeds ?? []).map((seed) => {
			return [seed.path, seed.content];
		})
	);

	const paths = [
		...new Set([
			...manifest.files.map((file) => {
				return file.path;
			}),
			...upstreamByPath.keys()
		])
	].toSorted();

	const actions: UpdateAction[] = [];

	for (const path of paths) {
		const recorded = manifestEntryOf(manifest, path);
		const kind = recorded?.kind ?? 'managed';

		if (path === CLAUDE_SETTINGS) {
			continue;
		}

		const seedContent = seedByPath.get(path);

		if (seedContent !== undefined) {
			const upstream = upstreamByPath.get(path) ?? null;

			if (upstream === null) {
				// The path left the managed set and is a seed now: the repository owns its content. An
				// untouched file takes the current seed, an edited one is left alone.
				const local = readLiveFile(cwd, path);
				const base = readBaseCopy(cwd, path);

				if (local !== null && local === base) {
					actions.push({
						path,
						kind: 'update',
						reason: 'the file is a seed now',
						content: seedContent
					});
				}

				continue;
			}

			if (recorded === null && readLiveFile(cwd, path) === seedContent) {
				// The path entered the managed set and the repository still holds the seed it wrote
				// before: the harness takes the file over instead of reporting a conflict.
				actions.push({
					path,
					kind: 'update',
					reason: 'the file is managed now',
					content: upstream
				});

				continue;
			}
		}

		const override = overrides?.get(path);

		if (override !== undefined) {
			const local = readLiveFile(cwd, path);

			actions.push({
				path,
				kind: 'update',
				reason: 'resolved',
				content: kind === 'block' && local !== null ? embedBlockUnit(local, override) : override
			});

			continue;
		}

		const ctx: PathContext = {
			path,
			kind,
			upstream: upstreamByPath.get(path) ?? null,
			base: readBaseCopy(cwd, path),
			local: readLiveFile(cwd, path)
		};

		const action =
			kind === 'config' ? decideConfig(ctx) : kind === 'block' ? await decideBlock(ctx) : await decideWholeFile(ctx);

		if (action !== null) {
			actions.push(action);
		}
	}

	const settings = settingsAction(cwd);

	if (settings !== null) {
		actions.push(settings);
	}

	const conflicts = actions.filter((action) => {
		return action.kind === 'conflict';
	});

	return {
		actions,
		conflicts
	};
};
