import pkg from '../../package.json' with { type: 'json' }

export interface PkgInfo {
	name: string
	version: string
	description: string
	bin: Record<string, string>
	keywords: string[]
	engines: { node: string }
}

export const PKG_INFO: PkgInfo = {
	name: pkg.name,
	version: pkg.version,
	description: pkg.description,

	bin: pkg.bin as Record<string, string>,
	keywords: pkg.keywords ?? [],
	engines: pkg.engines as { node: string }
}
