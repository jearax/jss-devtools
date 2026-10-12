import { styleText } from 'node:util'

// Logs go to stderr; stdout is reserved for data (logger.json) so `--json | jq`
// pipelines stay clean even when a step logs mid-run.
const write = (line: string): void => {
	process.stderr.write(`${line}\n`)
}

// Exit quietly when a downstream pipe reader closes early (`| jq`, `| head`):
// writing the JSON document after the reader died would otherwise crash a
// successful run with an unhandled EPIPE. Any other stdout error still throws.
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
	if (err.code === 'EPIPE') {
		process.exit(0)

		return
	}

	throw err
})

export const logger = {
	error: (message: string) => write(`${styleText('red', '✖')} ${message}`),
	warn: (message: string) => write(`${styleText('yellow', '⚠')} ${message}`),
	info: (message: string) => write(`${styleText('cyan', 'ℹ')} ${message}`),
	success: (message: string) => write(`${styleText('green', '✔')} ${message}`),
	log: (message: string) => write(message),

	json: (result: object) => {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	}
}
