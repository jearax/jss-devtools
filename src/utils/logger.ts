import consola from 'consola'
import { colors } from 'consola/utils'

export const logger = {
	error: (message: string) => consola.error(message),
	success: (message: string) => consola.success(message),
	info: (message: string) => consola.info(message),
	warn: (message: string) => consola.warn(message),
	log: (message: string) => consola.log(message),
	debug: (message: string) => consola.debug(message),

	primary: (message: string) => consola.log(colors.cyan(message)),
	secondary: (message: string) => consola.log(colors.magenta(message)),
	muted: (message: string) => consola.log(colors.gray(message)),
	text: (message: string) => consola.log(colors.white(message)),

	box: (message: string) => consola.box(message),
	start: (message: string) => consola.start(message),
	ready: (message: string) => consola.ready(message),

	raw: (message: string) => console.log(message),
	banner: (message: string) => console.log(colors.cyan(message)),
	tagline: (message: string) => console.log(colors.gray(message)),

	// Machine-readable output — written raw to stdout so `| jq` pipelines (and
	// any host process capturing pipes) always receive it deterministically,
	// independent of consola's reporter/stream scheduling.
	json: (result: object) => {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	}
}
