import { styleText } from 'node:util';

import type { UpdatePlan } from '@/modules/harness/types/update.type';

const MARKS = {
	create: '+',
	update: '~',
	delete: '-',
	conflict: '!'
} as const;

const MARK_COLOURS = {
	create: 'green',
	update: 'yellow',
	delete: 'red',
	conflict: 'red'
} as const;

const COUNT_LABELS = {
	create: 'to create',
	update: 'to update',
	delete: 'to delete',
	conflict: 'conflicts'
} as const;

const renderPath = (path: string): string => {
	const slash = path.lastIndexOf('/');

	return slash === -1 ? path : `${styleText('dim', path.slice(0, slash + 1))}${path.slice(slash + 1)}`;
};

const pathCollator = new Intl.Collator('en', {
	numeric: true,
	sensitivity: 'base'
});

const comparePaths = (a: string, b: string): number => {
	const aSegments = a.split('/');
	const bSegments = b.split('/');

	const folderLast = (segments: readonly string[], index: number): boolean => {
		return index + 1 < segments.length;
	};

	for (let index = 0; index < Math.min(aSegments.length, bSegments.length); index++) {
		const aSegment = aSegments[index];
		const bSegment = bSegments[index];

		if (aSegment === undefined || bSegment === undefined || aSegment === bSegment) {
			continue;
		}

		const aFolder = folderLast(aSegments, index);
		const bFolder = folderLast(bSegments, index);

		if (aFolder !== bFolder) {
			return aFolder ? -1 : 1;
		}

		return pathCollator.compare(aSegment, bSegment);
	}

	return aSegments.length - bSegments.length;
};

export const renderUpdatePlan = (plan: UpdatePlan): string => {
	return [...plan.actions]
		.sort((a, b) => {
			return comparePaths(a.path, b.path);
		})
		.map((entry) => {
			const mark = styleText(MARK_COLOURS[entry.kind], MARKS[entry.kind]);

			return `${mark} ${renderPath(entry.path)}`;
		})
		.join('\n');
};

export const updateActionCounts = (plan: UpdatePlan): Record<string, number> => {
	const counts: Record<string, number> = {};

	for (const entry of plan.actions) {
		counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
	}

	return counts;
};

export const renderHeading = (plan: UpdatePlan, projectName: string): string => {
	const counts = updateActionCounts(plan);

	const parts = (['create', 'update', 'delete', 'conflict'] as const).flatMap((kind) => {
		const count = counts[kind] ?? 0;

		return count === 0 ? [] : [styleText(MARK_COLOURS[kind], `${count} ${COUNT_LABELS[kind]}`)];
	});

	return `Changes in ${projectName}: ${parts.join('; ')}`;
};

export const conflictMessage = (plan: UpdatePlan): string => {
	const paths = plan.conflicts
		.map((conflict) => {
			return `   ${conflict.path} — ${conflict.reason}`;
		})
		.join('\n');

	return `Cannot finish the update: ${plan.conflicts.length} conflicting ${plan.conflicts.length === 1 ? 'file' : 'files'}\n${paths}`;
};
