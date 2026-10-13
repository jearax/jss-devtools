import { Agent } from 'package-manager-detector'

import { InitConflictEntry, InitSkippedEntry } from '@/commands/init/types'

export type PlanAction =
	| { kind: 'git-init' }
	| { kind: 'write-file'; path: string; content: string }
	// Rewrites a file the project already owns; reported as modified, not generated.
	| { kind: 'update-file'; path: string; content: string }
	| { kind: 'remove-file'; path: string }
	| {
			kind: 'manifest-edit'
			scripts: Record<string, string>
			lintStaged?: Record<string, string[]>
			devDeps?: Record<string, string>
	  }
	| { kind: 'install'; devSpecs: string[] }
	| { kind: 'husky-activate' }

export interface ResolvedSpecs {
	/** devDependency specs (`eslint@^10.9.1`) after filtering user-declared pkgs. */
	dev: string[]
	/** true when registry was unreachable and specs fell back to `@latest`. */
	offlineFallback: boolean
}

export interface PlanContext {
	pm: Agent
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
