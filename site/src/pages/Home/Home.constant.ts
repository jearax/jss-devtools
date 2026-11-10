/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

import { createElement } from 'react';

import { TerminalTab } from '@/components/Terminal/Terminal';
import { HARNESS_TRANSCRIPT, INIT_RUN_TRANSCRIPT } from '@/constants/transcripts.constant';
import ClaudeCodeScreen from '@/pages/Home/components/ClaudeCodeScreen/ClaudeCodeScreen';

/*
 * The value line. One sentence, one copy deck: it wraps naturally under its own width cap, so a
 * narrow viewport never renders a ragged forced break.
 */
export const VALUE_LINES: readonly string[] = [
	"Set up a JavaScript repository's toolchain, check that it works, and give your AI coding agent the rules — from one CLI."
];

export const HERO_TERMINAL_TABS: readonly TerminalTab[] = [
	{
		label: 'init',
		comment: 'Set up a project',
		command: 'jss-devtools init my-app',
		prompt: {
			dir: '~',
			git: false
		},
		lines: INIT_RUN_TRANSCRIPT,
		advance: true
	},
	{
		label: 'Claude Code',
		comment: 'Open the project in Claude Code',
		history: [
			{
				prompt: {
					dir: '~',
					git: false
				},
				command: 'cd my-app'
			}
		],
		command: 'claude',
		screen: createElement(ClaudeCodeScreen)
	},
	{
		label: 'harness',
		comment: 'Check the repository harness',
		command: 'jss-devtools harness doctor',
		lines: HARNESS_TRANSCRIPT
	}
];
