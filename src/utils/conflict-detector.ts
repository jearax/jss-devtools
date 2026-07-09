/**
 * Package Conflict Detection Utilities
 * Detects version conflicts between installed and planned packages.
 * Compat is judged against the planned package's declared range (OR-range aware),
 * so a consumer on typescript-eslint@8 is compatible with a "^6||^7||^8" range.
 */

import { isVersionInRange } from '@/utils/semver-helpers'

export interface PackageConflict {
	name: string
	installedVersion?: string
	plannedVersion?: string
	isCompatible: boolean
}

/**
 * Compatible khi installed version thỏa mãn declared range của planned package.
 * Planned range có thể là OR range ("^6||^7||^8") hoặc open range (">=0.8.0").
 */
const areVersionsCompatible = (installedVersion: string, plannedRange: string): boolean => {
	return isVersionInRange(installedVersion, plannedRange)
}

/**
 * Detect package conflicts giữa installed và planned
 */
export const detectPackageConflicts = (
	installedPackages: Map<string, string>, // name → version
	plannedPackages: Map<string, string> // name → version
): PackageConflict[] => {
	const conflicts: PackageConflict[] = []

	for (const [name, plannedVersion] of plannedPackages.entries()) {
		const installedVersion = installedPackages.get(name)

		if (installedVersion) {
			const isCompatible = areVersionsCompatible(installedVersion, plannedVersion)

			conflicts.push({
				name,
				installedVersion,
				plannedVersion,
				isCompatible
			})
		}
	}

	return conflicts
}

/**
 * Get packages to skip (đã có compatible version)
 */
export const getSkipList = (conflicts: PackageConflict[]): string[] => {
	return conflicts.filter((c) => c.isCompatible).map((c) => c.name)
}

/**
 * Get packages cần overwrite (version khác)
 */
export const getOverwriteList = (conflicts: PackageConflict[]): string[] => {
	return conflicts.filter((c) => !c.isCompatible).map((c) => c.name)
}
