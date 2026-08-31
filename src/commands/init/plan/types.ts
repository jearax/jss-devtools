import { AgentName } from 'package-manager-detector'

import { InitArgs, InitConflictEntry, InitSkippedEntry } from '@/commands/init/types'

export type PlanAction =
	| { kind: 'git-init' }
	| { kind: 'write-file'; path: string; content: string }
	| { kind: 'remove-file'; path: string }
	| {
			kind: 'manifest-edit'
			scripts: Record<string, string>
			lintStaged?: Record<string, string[]>
			devDeps?: Record<string, string>
			runtimePlacement?: {
				specs: Record<string, string>
				as: 'dependencies' | 'peer+dev'
			}
	  }
	| { kind: 'install'; devSpecs: string[]; specs: string[] }
	| { kind: 'husky-activate' }

export interface ResolvedSpecs {
	/** devDependency specs (`eslint@^10.9.1`) after filtering user-declared pkgs. */
	dev: string[]
	/** framework runtime specs, placed per app/library rules. */
	runtime: string[]
	/** pinned one-off spec reused by hook + lint-staged entries. */
	ppjSpec: string
	/** library (non-private + exports/types) → peers; app → dependencies. */
	runtimePlacement: 'dependencies' | 'peer+dev' | 'none'
	/** true when registry was unreachable and specs fell back to `@latest`. */
	offlineFallback: boolean
}

export interface PlanContext {
	pm: AgentName
	isYarnBerry: boolean
	manifest: Record<string, unknown>
	hasGit: boolean
	specs: ResolvedSpecs
	readFile: (path: string) => string | null
}

export interface InitPlan {
	actions: PlanAction[]
	conflicts: InitConflictEntry[]
	skipped: InitSkippedEntry[]
	pendingConflicts: Array<{ target: string; existing: string[] }>
}

export type PlanComputeInput = InitArgs
