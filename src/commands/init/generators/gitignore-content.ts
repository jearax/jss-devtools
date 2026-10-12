export const GITIGNORE_PATH = '.gitignore'

// Only what init itself makes necessary: without it, `git add .` after
// install stages the dependency tree and the first pre-commit run lints it.
export const buildGitignoreContent = (): string => 'node_modules/\n'
