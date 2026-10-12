import { defineCommand } from 'citty'

import { PKG_INFO } from '@/utils/pkg'

const routerCommand = defineCommand({
	meta: {
		name: PKG_INFO.bin,
		version: PKG_INFO.version,
		description: PKG_INFO.description
	},

	subCommands: {
		init: () => import('@/commands/init.js').then((m) => m.default)
	}
})

export default routerCommand
