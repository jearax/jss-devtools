import { installPackages } from '@/core/adapters/package-manager.adapter';
import { createTaskLog, runTasks, taskLogSummary } from '@/core/ui/terminal.ui';

import { formatWrittenFiles, installError, prettierPaths, sortPackageJson } from './init-format.service';
import { applyInitPlan } from './write.service';

import type { InitPlan, InitPreflight } from '@/commands/init/types/init-plan.type';

export const applyPlanWithInstall = async (
	plan: InitPlan,
	preflight: InitPreflight,
	relativeTarget: string
): Promise<void> => {
	await applyInitPlan(plan);

	const startedAt = Date.now();
	const installLog = createTaskLog(`Installing with ${preflight.pm}`);

	const code = await installPackages(preflight.pm, plan.targetDir, (line) => {
		installLog.message(line);
	});

	if (code !== 0) {
		installLog.error();

		throw installError(preflight, relativeTarget);
	}

	installLog.success(taskLogSummary(`Installed with ${preflight.pm}`, (Date.now() - startedAt) / 1000));

	const manifests = plan.entries
		.map((entry) => {
			return entry.path;
		})
		.filter((path) => {
			return path === 'package.json' || path.endsWith('/package.json');
		});

	const formatPaths = prettierPaths(plan.entries).filter((path) => {
		return !manifests.includes(path);
	});

	await runTasks([
		{
			title: 'Sorting package.json',
			run: async () => {
				await sortPackageJson(preflight, relativeTarget, plan.targetDir, manifests);

				return manifests.length === 1 ? 'Sorted package.json' : `Sorted ${manifests.length} package.json files`;
			}
		},
		{
			title: 'Formatting the written files',
			run: async () => {
				await formatWrittenFiles(preflight, relativeTarget, plan.targetDir, formatPaths);

				return `Formatted ${formatPaths.length} files`;
			}
		}
	]);
};
