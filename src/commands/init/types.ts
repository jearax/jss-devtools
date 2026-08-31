import { AgentName } from 'package-manager-detector'

import { CommandResultStatus } from '@/commands/self/utils/result'

export const FRAMEWORK_IDS = ['node', 'react', 'next'] as const

export type FrameworkId = (typeof FRAMEWORK_IDS)[number]

export type InitFeatureKey = 'linter' | 'commitlint' | 'install'

export interface InitFeatures {
	linter: boolean
	commitlint: boolean
	install: boolean
}

export interface InitArgs {
	framework: FrameworkId
	yes: boolean
	dryRun: boolean
	json: boolean
	features: InitFeatures
}

// Always-on behaviors report skips under their own labels so the result stays
// honest about what each run decided not to touch (e.g. pre-commit hook when
// the linter feature is off).
export type SkippedFeature = InitFeatureKey | 'git' | 'husky' | 'lint-staged' | 'typescript' | 'scripts'

export interface InitSkippedEntry {
	feature: SkippedFeature
	reason: string
}

export interface InitConflictEntry {
	path: string
	resolution: 'replaced' | 'kept'
}

export interface InitResult {
	schemaVersion: '1.0'
	command: 'init'
	status: CommandResultStatus
	framework: FrameworkId
	pm: AgentName | null
	generated: string[]
	modified: string[]
	installed: string[]
	skipped: InitSkippedEntry[]
	conflicts: InitConflictEntry[]
	dryRun: boolean
	message: string
	durationMs?: number
}
