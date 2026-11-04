/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

export const PRODUCT_DESCRIPTION = 'JavaScript stack dev tools CLI';

export const VALUE_LINE =
	"Set up a JavaScript repository's toolchain, check that it works, and give your AI coding agent the rules — from one CLI.";

/**
 * What the CLI works inside and with. The harness installs its hooks into Claude Code's
 * `.claude/settings.json`, and `doctor` checks these package managers while `--pm` installs with
 * one of them.
 */
export const WORKS_WITH: readonly string[] = ['Claude Code hooks', 'bun', 'pnpm', 'yarn', 'npm'];
