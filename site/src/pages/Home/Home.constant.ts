/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

import { TerminalTab } from '@/components/Terminal/Terminal';
import { INSTALL_COMMAND } from '@/constants/cli.constant';
import { DOCTOR_TRANSCRIPT, INIT_TRANSCRIPT } from '@/constants/transcripts.constant';

/*
 * The value line, pre-broken into lines that shrink line over line so the hero reads as a
 * narrowing triangle together with the headline: the sentence is one copy deck, the breaks are
 * the design. Each line is capped in `Hero`'s stylesheet, each cap tighter than the previous,
 * so the narrowing survives wherever the lines still fit on one rendered line.
 */
export const VALUE_LINES: readonly string[] = [
	"Set up a JavaScript repository's toolchain, check",
	'that it works, and give your AI coding agent',
	'the rules — from one CLI.'
];

/**
 * The hero terminal's transcripts. Each tab is named after the working directory a real session
 * would sit in, and its purpose moves into the transcript as a shell comment; the doctor and
 * init tabs replay the CLI's real captured output, so the window reads as a terminal running
 * the CLI, not a marketing panel with a code block.
 */
export const HERO_TERMINAL_TABS: readonly TerminalTab[] = [
	{
		label: '~',
		comment: 'Install the CLI once, anywhere',
		command: INSTALL_COMMAND,
		lines: []
	},
	{
		label: '~',
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
