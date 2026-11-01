import { readConfig } from '@/modules/harness/services/config.service';
import { decisionsInForce } from '@/modules/harness/services/decisions.service';
import { installIssues } from '@/modules/harness/services/health-install.service';
import { akSkillIssues, learnedSkillIssues } from '@/modules/harness/services/health-skills.service';
import { stateIssues } from '@/modules/harness/services/health-state.service';
import { managedDriftIssues, stagedUpdateIssue } from '@/modules/harness/services/health-update.service';
import { learnedSkillNames } from '@/modules/harness/services/learned-skills.service';
import { readMemoryState } from '@/modules/harness/services/memory.service';
import { foldSkillUsage } from '@/modules/harness/services/skill-usage.service';
import { readManifest } from '@/modules/harness/services/update-manifest.service';

import type { CheckListRow } from '@/core/ui/check-list.ui';
import type { HealthContext, HealthIssue } from '@/modules/harness/types/health-issue.type';

const collectHealth = async (root: string): Promise<HealthIssue[]> => {
	const { config } = readConfig(root);
	const today = new Date().toISOString().slice(0, 10);

	let manifest: HealthContext['manifest'];

	try {
		manifest = readManifest(root);
	} catch {
		manifest = null;
	}

	const context: HealthContext = {
		root,
		config,
		today,
		manifest
	};

	return [
		...installIssues(context),
		...stateIssues(context),
		...learnedSkillIssues(root, config, today),
		...(await akSkillIssues(root)),
		...managedDriftIssues(root, manifest),
		stagedUpdateIssue(root)
	].filter((issue) => {
		return issue !== null;
	});
};

const usageOf = (root: string): Record<string, string> => {
	try {
		return foldSkillUsage(root, [], '');
	} catch {
		return {};
	}
};

const summaryRows = (root: string, config: HealthContext['config']): readonly CheckListRow[] => {
	const memory = readMemoryState(root);
	const maxChars = config.memory.maxChars;
	const usage = usageOf(root);

	const rows: CheckListRow[] = [
		{
			label: 'Memory',
			status: 'ok',
			detail: `${memory.size}/${maxChars ?? '?'} chars, ${memory.entries.length} entries`
		}
	];

	rows.push({
		label: 'Decisions',
		status: 'ok',
		detail: `${decisionsInForce(root).length} decisions in force`
	});

	for (const name of learnedSkillNames(root)) {
		const last = usage[name];

		rows.push({
			label: name,
			status: 'ok',
			detail: `last used ${last ?? 'never'}`
		});
	}

	return rows;
};

const issueRows = (issues: readonly HealthIssue[]): CheckListRow[] => {
	return issues.map((issue) => {
		const row: CheckListRow = {
			label: issue.label,
			status: issue.level === 'error' ? 'fail' : 'info',
			detail: issue.detail
		};

		if (issue.nextStep !== undefined) {
			row.note = issue.nextStep;
		}

		return row;
	});
};

export { collectHealth, issueRows, summaryRows };
