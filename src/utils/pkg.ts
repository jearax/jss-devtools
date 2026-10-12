import pkg from '../../package.json' with { type: 'json' }

export const PKG_INFO = {
	bin: Object.keys(pkg.bin)[0] ?? pkg.name,
	version: pkg.version,
	description: pkg.description
}
