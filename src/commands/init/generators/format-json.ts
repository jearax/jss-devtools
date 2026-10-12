// Mirrors how Prettier lays out JSON under the generated .editorconfig
// (tabs, width 2, print width 120): objects stay expanded, arrays of
// primitives collapse onto one line when they fit. Generated JSON is then
// prettier-clean without bundling Prettier into the CLI.
const PRINT_WIDTH = 120
const TAB_WIDTH = 2

const isPrimitive = (value: unknown): boolean => value === null || typeof value !== 'object'

const render = (value: unknown, depth: number, prefixLength: number): string => {
	const indent = '\t'.repeat(depth)
	const childIndent = '\t'.repeat(depth + 1)

	if (Array.isArray(value)) {
		const inline = `[${value.map((item) => JSON.stringify(item)).join(', ')}]`
		// +1 for the trailing comma a following sibling may add.
		const fits = depth * TAB_WIDTH + prefixLength + inline.length + 1 <= PRINT_WIDTH

		if (value.length === 0 || (value.every(isPrimitive) && fits)) {
			return inline
		}

		const items = value.map((item) => `${childIndent}${render(item, depth + 1, 0)}`)

		return `[\n${items.join(',\n')}\n${indent}]`
	}

	if (value !== null && typeof value === 'object') {
		const entries = Object.entries(value)

		if (entries.length === 0) {
			return '{}'
		}

		const lines = entries.map(([key, child]) => {
			const prefix = `${JSON.stringify(key)}: `

			return `${childIndent}${prefix}${render(child, depth + 1, prefix.length)}`
		})

		return `{\n${lines.join(',\n')}\n${indent}}`
	}

	return JSON.stringify(value)
}

export const formatJson = (value: unknown): string => `${render(value, 0, 0)}\n`
