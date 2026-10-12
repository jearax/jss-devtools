import { spinner } from '@clack/prompts'

import { logger } from '@/utils/logger'
import { isInteractive } from '@/utils/prompts'

export interface SpinnerHandle {
	update(text: string): void
	done(text?: string): void
	fail(text?: string): void
}

const noop = (): void => undefined

// silent: --json mode, where any extra line would corrupt the JSON document.
// Non-interactive (pipe/CI) degrades to plain step lines so captured logs
// still show the step boundaries.
export const startSpinner = (label: string, opts: { silent?: boolean } = {}): SpinnerHandle => {
	if (opts.silent === true) {
		return {
			update: noop,
			done: noop,
			fail: noop
		}
	}

	if (!isInteractive()) {
		logger.log(`⧉ ${label}`)

		return {
			update: (text) => logger.log(`⧉ ${text}`),
			done: (text) => logger.success(text ?? label),
			fail: (text) => logger.error(text ?? label)
		}
	}

	const sp = spinner({
		output: process.stderr,
		withGuide: false
	})

	sp.start(label)

	return {
		update: (text) => sp.message(text),
		done: (text) => sp.stop(text ?? label),
		fail: (text) => sp.error(text ?? label)
	}
}
