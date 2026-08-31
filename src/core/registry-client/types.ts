export interface PackageVersionDoc {
	peerDependencies?: Record<string, string>
}

export interface PackageMetadata {
	name: string
	'dist-tags': Record<string, string>
	versions: string[]
	/** Raw per-version docs keyed by version — carries peer ranges the normalized `versions` array drops. */
	versionDocs?: Record<string, PackageVersionDoc>
	time?: Record<string, string>
}
