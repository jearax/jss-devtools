import { select } from '@clack/prompts'

import { InitPlan } from '@/commands/init/plan/types'
import { InitArgs } from '@/commands/init/types'
import { logger } from '@/utils/logger'
import { isTTY } from '@/utils/prompts'

export type ConfirmDecision =
	| { kind: 'proceed' }
	| { kind: 'proceed-keeping'; keptTargets: string[] }
	| { kind: 'cancelled' }
	| { kind: 'requires-confirmation' }

// Single summary gate (kongming): every overwrite and install command is
// visible in one prompt; per-file prompting would fragment the decision.
// --json auto-defaults like --yes (confirmOrCancel convention).
export const confirmPlan = async (args: InitArgs, plan: InitPlan, displayLines: string[]): Promise<ConfirmDecision> => {
	if (plan.pendingConflicts.length === 0) {
		return { kind: 'proceed' }
	}

	if (args.yes || args.json) {
		return { kind: 'proceed' }
	}

	if (!isTTY()) {
		return { kind: 'requires-confirmation' }
	}

	const answer = await select({
		message: `Existing configs found:\n${displayLines.join('\n')}\n\nReplace them with jss-devtools configs?`,
		options: [
			{
				value: 'replace',
				label: 'Replace all'
			},
			{
				value: 'keep',
				label: 'Keep existing (skip conflicting writes)'
			},
			{
				value: 'cancel',
				label: 'Cancel'
			}
		]
	})

	if (answer === 'keep') {
		return {
			kind: 'proceed-keeping',
			keptTargets: plan.pendingConflicts.map((conflict) => conflict.target)
		}
	}

	if (answer === 'cancel' || answer === undefined) {
		return { kind: 'cancelled' }
	}

	return { kind: 'proceed' }
}

export const logRequiresConfirmation = (): void => {
	logger.error('Existing configs conflict with the plan. Pass --yes to replace them in non-interactive mode.')
}
