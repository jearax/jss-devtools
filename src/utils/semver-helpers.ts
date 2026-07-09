/**
 * Semver range helpers for ESLint 8 compat resolution.
 * Supports OR ranges ("^6.0.0 || ^7.0.0 || ^8.0.0") and open ranges (">=0.8.0").
 */

/**
 * Extract the major version number from a single version string.
 * "^8.62.0" → 8, "8.57.1" → 8, ">=8" → 8.
 */
export const extractMajor = (version: string): number | null => {
	const match = version?.match(/(\d+)/)
	return match ? Number(match[1]) : null
}

/**
 * Parse all pinned majors from a semver range. Returns [] for open ranges
 * (">=X", "*") which have no upper major bound.
 * "^6.0.0 || ^7.0.0" → [6, 7], ">=0.8.0" → [], "*" → []
 */
export const parseMajors = (range: string): number[] => {
	if (!range || range.includes('>=') || range.includes('*')) return []

	const majors = new Set<number>()
	for (const part of range.split('||')) {
		const match = part.trim().match(/[~^]?(\d+)/)
		if (match) majors.add(Number(match[1]))
	}
	return [...majors]
}

/**
 * True if the installed version's major is allowed by the declared range.
 * Open ranges (>=, *) accept anything. Unknown versions are assumed compatible.
 */
export const isVersionInRange = (installedVersion: string | undefined, range: string): boolean => {
	if (!installedVersion) return true

	const majors = parseMajors(range)
	if (majors.length === 0) return true // open range

	const installedMajor = extractMajor(installedVersion)
	if (installedMajor === null) return true

	return majors.includes(installedMajor)
}
