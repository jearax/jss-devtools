/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

import { TerminalTab } from '@/components/Terminal/Terminal';
import { INSTALL_COMMAND } from '@/constants/cli.constant';
import { DOCTOR_TRANSCRIPT, INIT_TRANSCRIPT, INSTALL_TRANSCRIPT } from '@/constants/transcripts.constant';

/*
 * The value line. One sentence, one copy deck: it wraps naturally under its own width cap, so a
 * narrow viewport never renders a ragged forced break.
 */
export const VALUE_LINES: readonly string[] = [
	"Set up a JavaScript repository's toolchain, check that it works, and give your AI coding agent the rules — from one CLI."
];

/**
 * The hero terminal's transcripts. Each tab is named after the working directory a real session
 * would sit in — all distinct, so a reader can pick by name — and its purpose moves into the
 * transcript as a shell comment; the transcripts replay the installer's and the CLI's real
 * captured output, so the window reads as a terminal running the CLI, not a marketing panel with
 * a code block.
 */
export const HERO_TERMINAL_TABS: readonly TerminalTab[] = [
	{
		label: '~',
		comment: 'Install the CLI once, anywhere',
		command: INSTALL_COMMAND,
		lines: INSTALL_TRANSCRIPT
	},
	{
		label: '~/jss-devtools',
		comment: 'Check the environment',
		command: 'jss-devtools doctor',
		lines: DOCTOR_TRANSCRIPT
	},
	{
		label: '~/projects/my-app',
		comment: 'Set up a project',
		command: 'jss-devtools init',
		lines: INIT_TRANSCRIPT
	}
];
