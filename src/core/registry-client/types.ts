export interface PackageMetadata {
	name: string
	'dist-tags': Record<string, string>
	versions: string[]
	time?: Record<string, string>
}
