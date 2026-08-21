// Shared package-manager constants used by detectors and the self-installer.
// Split from global-pm.ts so future detectors (Phase 03 scaffold: eslint/prettier
// detection) can reuse naming + ordering without importing probe logic.
import { AgentName } from 'package-manager-detector'

export const PM_DISPLAY_NAMES: Record<AgentName, string> = {
	npm: 'npm',
	pnpm: 'pnpm',
	yarn: 'yarn (classic)',
	bun: 'bun',
	deno: 'deno',
	nub: 'nub',
	aube: 'aube'
}

// Probe priority — first match at this rank wins (parallel probe preserves order).
export const PROBE_ORDER: AgentName[] = ['pnpm', 'npm', 'yarn', 'bun']
