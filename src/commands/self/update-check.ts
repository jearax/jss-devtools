import { defineCommand } from 'citty'
import semver from 'semver'

import { detectGlobalPM } from '@/core/detector/global-pm'
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

// Version-list helper — lives here (not in update.ts) so the check handler
// owns its display logic; update.ts stays a thin alias dispatcher.
export const fetchAndDisplayUpdates = async (pkg: string, currentVersion: string, jsonMode: boolean): Promise<void> => {
	const meta = await fetchPackageMetadata(pkg)
	const all = meta.versions.filter((v: string): v is string => semver.valid(v) !== null && !semver.prerelease(v))
	const byMajor = new Map<number, string>()

	for (const v of all) {
		const major = semver.major(v)
		const existing = byMajor.get(major)

		if (!existing || semver.gt(v, existing)) {
			byMajor.set(major, v)
		}
	}

	const sorted = [...byMajor.values()].sort(semver.rcompare).slice(0, 5)
	const latest = meta['dist-tags'].latest ?? sorted[0] ?? currentVersion
	const hasUpdate = semver.gt(latest, currentVersion)

	if (jsonMode) {
		console.log(
			JSON.stringify(
				{
					schemaVersion: '1.0',
					command: 'update check',
					result: 'noop',
					package: pkg,
					current: currentVersion,
					latestStable: latest,
					hasUpdate,
					versions: sorted.map((v) => ({
						version: v,
						releasedAt: meta.time?.[v] ?? null,
						current: v === currentVersion
					}))
				},
				null,
				2
			)
		)
		return
	}

	logger.info(`Available versions of ${pkg} (latest stable per major):`)

	for (const v of sorted) {
		const date = meta.time?.[v]?.slice(0, 10) ?? 'unknown'
		const marker = v === currentVersion ? ' ← current' : ''

		console.log(`  ${v.padEnd(10)} ${date}${marker}`)
	}

	console.log('')

	if (hasUpdate) {
		logger.info(`Run \`jss-devtools upgrade\` to update to ${latest}.`)
	} else {
		logger.info('Already at latest.')
	}
}

const updateCheckCommand = defineCommand({
	meta: {
		name: 'check',
		description: 'Show 5 latest stable versions of jss-devtools'
	},
	args: {
		json: {
			type: 'boolean',
			description: 'Output structured JSON',
			default: false
		}
	},
	run: async ({ args }) => {
		const detected = await detectGlobalPM(PKG_INFO.name)
		const current = detected?.version ?? '0.0.0'

		try {
			await fetchAndDisplayUpdates(PKG_INFO.name, current, args.json === true)
		} catch (err) {
			logger.error(`Failed to fetch versions: ${String(err)}`)
			process.exitCode = 2

			return
		}
	}
})

export default updateCheckCommand
