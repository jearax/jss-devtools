import { describe, expect, it } from 'vitest'

import { buildGitignoreContent } from '@/commands/init/generators/gitignore-content'

describe('buildGitignoreContent', () => {
	it('covers the toolchain artifacts init generates', () => {
		const content = buildGitignoreContent()

		expect(content).toContain('node_modules/')
		expect(content).toContain('dist/')
		expect(content).toContain('coverage/')
		expect(content).toContain('.DS_Store')
	})

	it('is idempotent (stable content)', () => {
		expect(buildGitignoreContent()).toBe(buildGitignoreContent())
	})
})
