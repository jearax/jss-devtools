/**
 * Package installation utilities
 * Cross-platform package installation without nypm's ANSI issues
 */

import type { PackageManager } from 'nypm'
import { execa } from 'execa'
import { cwd } from 'node:process'
import { logger } from '@/utils/logger'

/**
 * Add production dependencies
 * @param packageNames - Package names to install
 * @param pm - Package manager
 */
export async function addDependency(packageNames: string | string[], pm?: PackageManager): Promise<void> {
	if (!pm) {
		throw new Error('Package manager is required')
	}

	const names = Array.isArray(packageNames) ? packageNames : [packageNames]
	if (names.length === 0) return

	const pmName = pm.name
	const flags = getInstallCommand(pmName, false)

	try {
		logger.log(`Installing production dependencies: ${names.join(', ')}`)
		await execa(pmName, flags.concat(names), { stdio: 'inherit', cwd: cwd() })
	} catch (error) {
		throw new Error(`Failed to install dependencies: ${error}`)
	}
}

/**
 * Add dev dependencies
 * @param packageNames - Package names to install
 * @param pm - Package manager
 */
export async function addDevDependency(packageNames: string | string[], pm?: PackageManager): Promise<void> {
	if (!pm) {
		throw new Error('Package manager is required')
	}

	const names = Array.isArray(packageNames) ? packageNames : [packageNames]
	if (names.length === 0) return

	const pmName = pm.name
	const flags = getInstallCommand(pmName, true)

	try {
		logger.log(`Installing dev dependencies: ${names.join(', ')}`)
		await execa(pmName, flags.concat(names), { stdio: 'inherit', cwd: cwd() })
	} catch (error) {
		throw new Error(`Failed to install dev dependencies: ${error}`)
	}
}

/**
 * Get install command flags for package manager (without pmName)
 * @param pmName - Package manager name
 * @param isDev - Whether this is a dev dependency
 * @returns Install command flags
 */
function getInstallCommand(pmName: string, isDev: boolean): string[] {
	const commands: Record<string, string[]> = {
		npm: isDev ? ['install', '--save-dev'] : ['install'],
		yarn: isDev ? ['add', '--dev'] : ['add'],
		pnpm: isDev ? ['add', '--save-dev'] : ['add'],
		bun: isDev ? ['add', '--development'] : ['add']
	}

	return commands[pmName] || commands.npm
}
