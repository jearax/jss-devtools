import { defineCommand } from 'citty'

import { displayBanner } from '@/utils/banner'
import { PKG_INFO } from '@/utils/pkg'

const versionCommand = defineCommand({
	meta: {
		name: 'version',
		description: 'Print CLI version'
	},

	run: () => {
		displayBanner()
		console.log(PKG_INFO.version)
	}
})

export default versionCommand
