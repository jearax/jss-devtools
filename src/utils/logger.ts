import consola from 'consola'
import { colors } from 'consola/utils'

export const logger = {
	error: (message: string) => consola.error(message),
	success: (message: string) => consola.success(message),
	info: (message: string) => consola.info(message),
	warn: (message: string) => consola.warn(message),
	log: (message: string) => consola.log(message),

	primary: (message: string) => consola.log(colors.cyan(message)),
	secondary: (message: string) => consola.log(colors.magenta(message)),
	muted: (message: string) => consola.log(colors.gray(message)),
	text: (message: string) => consola.log(colors.white(message)),

	box: (message: string) => consola.box(message),
	start: (message: string) => consola.start(message),
	ready: (message: string) => consola.ready(message),

	// Raw output - bypass consola for ASCII art (consola breaks multiline chars)
	raw: (message: string) => console.log(message),
	banner: (message: string) => console.log(colors.cyan(message)),
	tagline: (message: string) => console.log(colors.gray(message))
}
