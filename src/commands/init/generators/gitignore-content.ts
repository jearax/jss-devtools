// Minimal .gitignore covering the toolchain init generates. Without it, a
// fresh `git init` + `git add .` sweeps node_modules into the index, and the
// very first pre-commit run blows up lint-staged with OOM.
export const GITIGNORE_PATH = '.gitignore'

export const buildGitignoreContent = (): string =>
	`# dependencies\nnode_modules/\n\n# build output\ndist/\nbuild/\n*.tsbuildinfo\n\n# logs / coverage\n*.log\ncoverage/\n\n# editor\n.vscode/\n.idea/\n.DS_Store\n`
