/**
 * Package Conflict Detection Utilities
 * Detects version conflicts between installed and planned packages
 */

export interface PackageConflict {
	name: string
	installedVersion?: string
	plannedVersion?: string
	isCompatible: boolean // True nếu versions tương đương
}

/**
 * Extract major version từ semver string
 */
const extractMajorVersion = (version: string): string | null => {
	const match = version.match(/[\^~>=]?(\d+)(\.\d+)?(\.\d+)?[x*]?/)
	return match ? match[1] : null
}

/**
 * Check nếu 2 versions tương đương (cùng major version)
 */
const areVersionsCompatible = (v1: string, v2: string): boolean => {
	const major1 = extractMajorVersion(v1)
	const major2 = extractMajorVersion(v2)

	if (!major1 || !major2) return true // Can't determine, assume compatible
	return major1 === major2
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
