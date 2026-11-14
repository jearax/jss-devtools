import { CliError } from '@/core/errors/cli.error';
import { HOOK_FILES } from '@/modules/harness/constants/harness-paths.constant';

import { extractBlockUnit, embedBlockUnit } from './block-region.service';
import { mergeHarnessConfig } from './config-merge.service';
import { mergeThreeWay } from './three-way-merge.service';

import type { UpdateAction } from '@/modules/harness/types/update.type';

export type PathContext = {
	path: string;
	kind: 'managed' | 'block' | 'config';
	upstream: string | null;
	base: string | null;
	local: string | null;
};

export const conflictAction = (ctx: PathContext, reason: string, proposal: string): UpdateAction => {
	return {
		path: ctx.path,
		kind: 'conflict',
		reason,
		content: proposal
	};
};

export const decideWholeFile = async (ctx: PathContext): Promise<UpdateAction | null> => {
	const { path, upstream, base, local } = ctx;

	if (upstream === null) {
		if (local === null) {
			return null;
		}

		if (local === base) {
			return {
				path,
				kind: 'delete',
				reason: 'dropped upstream'
			};
		}

		return conflictAction(ctx, 'edited a file dropped upstream', local);
	}

	// Doctor compares these two with the CLI's own copies, so an edit must not survive update.
	if (HOOK_FILES.includes(path)) {
		return local === upstream
			? null
			: {
					path,
					kind: 'update',
					reason: 'hook file restored',
					content: upstream
				};
	}

	if (local === null) {
		return conflictAction(ctx, 'managed file deleted locally', upstream);
	}

	if (base === null) {
		return local === upstream ? null : conflictAction(ctx, 'unmanaged file in a managed path', upstream);
	}

	if (local === base) {
		return local === upstream
			? null
			: {
					path,
					kind: 'update',
					reason: 'upstream change',
					content: upstream
				};
	}

	const merged = await mergeThreeWay(local, base, upstream);

	if (merged.conflicted) {
		return conflictAction(ctx, 'overlapping edits', merged.content);
	}

	if (merged.content === local) {
		return null;
	}

	return {
		path,
		kind: 'update',
		reason: 'merged local edits with the upstream change',
		content: merged.content
	};
};

export const decideBlock = async (ctx: PathContext): Promise<UpdateAction | null> => {
	const { path, upstream, base, local } = ctx;

	if (upstream === null || local === null) {
		return conflictAction(
			ctx,
			local === null ? 'managed file deleted locally' : 'edited a block dropped upstream',
			local ?? upstream ?? ''
		);
	}

	const baseUnit = base === null ? null : extractBlockUnit(base);
	const upUnit = extractBlockUnit(upstream);
	const localUnit = extractBlockUnit(local);

	if (upUnit === null) {
		throw new CliError(`the upstream template for ${path} has no harness block`);
	}

	if (localUnit === null) {
		return conflictAction(ctx, 'the harness block was removed from CLAUDE.md', embedBlockUnit(local, upUnit));
	}

	if (baseUnit === null) {
		return local === upstream ? null : conflictAction(ctx, 'unmanaged file in a managed path', upstream);
	}

	if (localUnit === baseUnit) {
		if (upUnit === baseUnit) {
			return null;
		}

		return {
			path,
			kind: 'update',
			reason: 'upstream change',
			content: embedBlockUnit(local, upUnit)
		};
	}

	const merged = await mergeThreeWay(localUnit, baseUnit, upUnit);

	if (merged.conflicted) {
		return conflictAction(ctx, 'overlapping edits', embedBlockUnit(local, merged.content));
	}

	if (merged.content === localUnit) {
		return null;
	}

	return {
		path,
		kind: 'update',
		reason: 'merged local edits with the upstream change',
		content: embedBlockUnit(local, merged.content)
	};
};

export const decideConfig = (ctx: PathContext): UpdateAction | null => {
	const { base, local, upstream } = ctx;

	if (local === null) {
		return upstream === null
			? null
			: {
					path: ctx.path,
					kind: 'update',
					reason: 'config restored from the template',
					content: upstream
				};
	}

	const merged = mergeHarnessConfig(base, local);

	if (merged.conflictKeys.length > 0) {
		return conflictAction(ctx, `both sides changed ${merged.conflictKeys.join(', ')}`, merged.content);
	}

	return merged.content === local
		? null
		: {
				path: ctx.path,
				kind: 'update',
				reason: 'config keys brought to the current defaults',
				content: merged.content
			};
};
