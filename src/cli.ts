import { runMain, showUsage } from 'citty'

import routerCommand from '@/cli/router'
import { printBanner } from '@/utils/banner'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

process.on('uncaughtException', (err) => logger.error(String(err)))
process.on('unhandledRejection', (err) => logger.error(String(err)))

const argv = process.argv.slice(2)

// citty prints only the bare version for -v/--version; add the banner first.
if (argv.length === 1 && (argv[0] === '--version' || argv[0] === '-v')) {
	printBanner({ tagline: true })
	process.stdout.write(`${PKG_INFO.version}\n`)
	process.exit(0)
}

runMain(routerCommand, {
	showUsage: async (cmd, parent) => {
		printBanner()
		await showUsage(cmd, parent)
	}
})
