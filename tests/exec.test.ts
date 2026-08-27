// Unit tests for exec stdio routing: human mode shares the terminal, json
// mode buffers child output so the JSON document stays alone on stdout.
import { execa } from 'execa'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { execOrDryRunRemove } from '@/core/self-installer/exec'

vi.mock('execa')

const mockedExeca = vi.mocked(execa)

beforeEach(() => {
	vi.clearAllMocks()
	mockedExeca.mockResolvedValue({ exitCode: 0 } as never)
})

describe('exec stdio routing', () => {
	it('shares the terminal by default (human mode watches live output)', async () => {
		await execOrDryRunRemove('pnpm', 'jss-devtools', false)

		expect(mockedExeca).toHaveBeenCalledWith('pnpm', expect.anything(), expect.objectContaining({ stdio: 'inherit' }))
	})

	it('buffers child stdio when capture is requested (json mode)', async () => {
		await execOrDryRunRemove('pnpm', 'jss-devtools', false, { capture: true })

		expect(mockedExeca).toHaveBeenCalledWith('pnpm', expect.anything(), expect.objectContaining({ stdio: 'pipe' }))
	})
})
