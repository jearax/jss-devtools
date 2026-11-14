import { styleText } from 'node:util';

import type { InitPlan } from '@/commands/init/types/init-plan.type';

const PLAN_MARKS = {
	create: '+',
	update: '~',
	delete: '-'
} as const;

const PLAN_MARK_COLOURS = {
	create: 'green',
	update: 'yellow',
	delete: 'red'
} as const;

const PLAN_COUNT_LABELS = {
	create: 'to create',
	update: 'to update',
	delete: 'to delete'
} as const;

const renderPath = (path: string): string => {
	const slash = path.lastIndexOf('/');

	return slash === -1 ? path : `${styleText('dim', path.slice(0, slash + 1))}${path.slice(slash + 1)}`;
};

const planPathCollator = new Intl.Collator('en', {
	numeric: true,
	sensitivity: 'base'
});

export const comparePlanPaths = (a: string, b: string): number => {
	const aSegments = a.split('/');
	const bSegments = b.split('/');

	for (let i = 0; i < Math.min(aSegments.length, bSegments.length); i++) {
		const aSegment = aSegments[i];
		const bSegment = bSegments[i];

		if (aSegment === undefined || bSegment === undefined || aSegment === bSegment) {
			continue;
		}

		const aIsFolder = i + 1 < aSegments.length;
		const bIsFolder = i + 1 < bSegments.length;

		if (aIsFolder !== bIsFolder) {
			return aIsFolder ? -1 : 1;
		}

		return planPathCollator.compare(aSegment, bSegment);
	}

	return aSegments.length - bSegments.length;
};

export const renderPlan = (plan: InitPlan): string => {
	return [...plan.entries]
		.sort((a, b) => {
			return comparePlanPaths(a.path, b.path);
		})
		.map((entry) => {
			const mark = styleText(PLAN_MARK_COLOURS[entry.action], PLAN_MARKS[entry.action]);

			return `${mark} ${renderPath(entry.path)}`;
		})
		.join('\n');
};

export const planActionCounts = (plan: InitPlan): Record<'create' | 'update' | 'delete', number> => {
	return {
		create: plan.entries.filter((entry) => {
			return entry.action === 'create';
		}).length,
		update: plan.entries.filter((entry) => {
			return entry.action === 'update';
		}).length,
		delete: plan.entries.filter((entry) => {
			return entry.action === 'delete';
		}).length
	};
};

export const renderPlanHeading = (plan: InitPlan, projectName: string): string => {
	const actionCounts = planActionCounts(plan);

	const counts = (['create', 'update', 'delete'] as const).flatMap((action) => {
		const count = actionCounts[action];

		return count === 0 ? [] : [styleText(PLAN_MARK_COLOURS[action], `${count} ${PLAN_COUNT_LABELS[action]}`)];
	});

	return `Changes in ${projectName}: ${counts.join('; ')}`;
};
