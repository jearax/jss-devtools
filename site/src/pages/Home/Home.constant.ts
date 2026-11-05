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
 * The hero terminal's transcripts. The install tab types the one command; the doctor and init
 * tabs replay the CLI's real captured output, so the window reads as a terminal running the
 * CLI, not a marketing panel with a code block.
 */
export const HERO_TERMINAL_TABS: readonly TerminalTab[] = [
	{
		label: 'install',
		command: INSTALL_COMMAND,
		lines: []
	},
	{
		label: 'doctor',
		command: 'jss-devtools doctor',
		lines: DOCTOR_TRANSCRIPT
	},
	{
		label: 'init',
		command: 'jss-devtools init',
		lines: INIT_TRANSCRIPT
	}
];
