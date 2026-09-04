// TTY-aware spinner helper. Wraps `ora` so the rest of the code never
// imports it directly and we can suppress consistently in --json / CI /
// piped contexts.
//
// Two layers:
//   startSpinner()            → returns a SpinnerHandle whose update/done/fail
//                                forward to ora (TTY) or become no-ops.
//   withSpinner(label, fn)    → wraps an async fn with start + done/fail.
//
// Both accept { silent?: boolean }. silent: true means "don't print anything"
// (used in --json mode so the spinner cannot corrupt the JSON envelope).
// When TTY is unavailable but silent is false, falls back to a plain text
// line so log-file captures still see the step boundary.
//
// `ora` is lazy-loaded via `await import('ora')` inside the interactive
// branch only — keeps the module's `sideEffects: false` (package.json)
// honest so tree-shaking continues to drop this helper from any consumer
// that never reaches the interactive path.

export interface SpinnerHandle {
	update(text: string): void
	done(text?: string): void
	fail(text?: string): void
}

interface StartOpts {
	silent?: boolean
}

export const isInteractive = (): boolean => Boolean(process.stdout.isTTY) && process.env['CI'] === undefined

export const startSpinner = async (label: string, opts: StartOpts = {}): Promise<SpinnerHandle> => {
	const silent = opts.silent ?? false

	if (silent) {
		return {
			update: noop,
			done: noop,
			fail: noop
		}
	}

	if (!isInteractive()) {
		process.stdout.write(`⧉ ${label}\n`)

		return {
			update: (text) => process.stdout.write(`⧉ ${text}\n`),
			done: (text) => process.stdout.write(`✓ ${text ?? label}\n`),
			fail: (text) => process.stderr.write(`✗ ${text ?? label}\n`)
		}
	}

	// Interactive branch: ora is only loaded when the terminal can render
	// animation. Any other path (silent, non-TTY, CI) keeps the import out.
	const { default: ora } = await import('ora')
	const spinner = ora(label).start()

	return {
		update: (text) => {
			spinner.text = text
		},
		done: (text) => {
			if (text !== undefined) {
				spinner.succeed(text)
			} else {
				spinner.succeed()
			}
		},
		fail: (text) => {
			if (text !== undefined) {
				spinner.fail(text)
			} else {
				spinner.fail()
			}
		}
	}
}

export const withSpinner = async <T>(
	label: string,
	fn: (handle: SpinnerHandle) => Promise<T>,
	opts: StartOpts = {}
): Promise<T> => {
	const handle = await startSpinner(label, opts)

	try {
		const result = await fn(handle)

		handle.done()

		return result
	} catch (error) {
		handle.fail()
		throw error
	}
}

const noop = (): void => undefined
