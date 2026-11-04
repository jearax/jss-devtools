import { cn } from '@jjuidev/design-system';
import { ComponentProps, CSSProperties, KeyboardEvent, useId, useState } from 'react';

import CopyButton from '@/components/CopyButton/CopyButton';

import styles from './styles.module.css';

export type TerminalTab = {
	label: string;
	command?: string;
	lines: readonly string[];
};

export type TerminalProps = ComponentProps<'div'> & {
	/** The window's title: the command, or the folder the terminal sits in. */
	title?: string;
	/** A note on the right of the title bar, for a transcript that is an example, not a promise. */
	label?: string;
	/** The command line, typed out in the animated variant. */
	command?: string;
	/** The CLI's output, one string per line, with its real glyphs. */
	lines?: readonly string[];
	/** The transcripts the reader switches between. */
	tabs?: readonly TerminalTab[];
	/** The name of the tab list, for a screen reader. */
	tabListLabel?: string;
	/** `animated` types the command and reveals the output; `static` shows the final state. */
	variant?: 'static' | 'animated';
	/**
	 * Puts an icon-only copy button at the right end of the command row, copying the shown
	 * command. The interaction follows the design system's `ButtonCopy` with `feedback="icon"`:
	 * the icon swaps Copy→Check for two seconds, and a screen-reader line says so.
	 */
	commandCopy?: boolean;
};

const GLYPH_TONES = {
	'✔': 'success',
	'✖': 'error',
	'⚠': 'warning',
	'◇': 'muted'
} as const;

type Tone = (typeof GLYPH_TONES)[keyof typeof GLYPH_TONES];

type Parts = {
	box: string;
	/** The spaces between the box drawing and the glyph. */
	spaces: string;
	glyph: string;
	tone: Tone | null;
	text: string;
};

const BOX = /^[┌│└├─]*/;
const SPACES = /^\s*/;

const split = (line: string): Parts => {
	const box = BOX.exec(line)?.[0] ?? '';
	const rest = line.slice(box.length);
	// The box drawing is followed by spaces, and the glyph comes after them.
	const spaces = SPACES.exec(rest)?.[0] ?? '';
	const afterSpaces = rest.slice(spaces.length);
	const glyph = afterSpaces[0] ?? '';
	const tone = glyph in GLYPH_TONES ? GLYPH_TONES[glyph as keyof typeof GLYPH_TONES] : null;

	return {
		box,
		spaces: tone === null ? '' : spaces,
		glyph: tone === null ? '' : glyph,
		tone,
		text: tone === null ? rest : afterSpaces.slice(1)
	};
};

const Terminal = ({
	className,
	title,
	label,
	command,
	lines,
	tabs,
	tabListLabel = 'Transcripts',
	variant = 'static',
	commandCopy = false,
	...props
}: TerminalProps) => {
	const [active, setActive] = useState(0);
	const baseId = useId();
	const tab = tabs?.[active];
	const shownCommand = tab?.command ?? command;
	const shownLines = tab?.lines ?? lines ?? [];

	const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		const last = (tabs?.length ?? 0) - 1;
		let next = index;

		if (event.key === 'ArrowRight') {
			next = index === last ? 0 : index + 1;
		} else if (event.key === 'ArrowLeft') {
			next = index === 0 ? last : index - 1;
		} else if (event.key === 'Home') {
			next = 0;
		} else if (event.key === 'End') {
			next = last;
		} else {
			return;
		}

		event.preventDefault();
		setActive(next);
		document.getElementById(`${baseId}-tab-${next}`)?.focus();
	};

	return (
		<div className={cn(styles.root, className)} data-variant={variant} {...props}>
			<div className={styles.bar}>
				<span className={styles.dots} aria-hidden="true">
					<span className={styles.dot} data-tone="error" />
					<span className={styles.dot} data-tone="warning" />
					<span className={styles.dot} data-tone="success" />
				</span>
				{title === undefined ? null : <span className={styles.title}>{title}</span>}
				<span className={styles.spacer} />
				{label === undefined ? null : <span className={styles.label}>{label}</span>}
			</div>

			{tabs === undefined ? null : (
				<div className={styles.tabs} role="tablist" aria-label={tabListLabel}>
					{tabs.map((item, index) => {
						return (
							<button
								key={item.label}
								type="button"
								role="tab"
								id={`${baseId}-tab-${index}`}
								aria-selected={index === active}
								aria-controls={`${baseId}-panel-${index}`}
								tabIndex={index === active ? 0 : -1}
								className={styles.tab}
								data-selected={index === active ? 'true' : undefined}
								onClick={() => {
									setActive(index);
								}}
								onKeyDown={(event) => {
									onTabKeyDown(event, index);
								}}
							>
								{item.label}
							</button>
						);
					})}
				</div>
			)}

			<div
				className={styles.body}
				role={tabs === undefined ? undefined : 'tabpanel'}
				id={tabs === undefined ? undefined : `${baseId}-panel-${active}`}
				aria-labelledby={tabs === undefined ? undefined : `${baseId}-tab-${active}`}
			>
				{shownCommand === undefined ? null : (
					<div className={styles.commandRow}>
						<p
							key={shownCommand}
							className={styles.command}
							style={{ '--chars': shownCommand.length + 3 } as CSSProperties}
						>
							<span className={styles.prompt}>$</span> {shownCommand}
						</p>
						{commandCopy && shownCommand !== '' ? (
							<CopyButton
								className={styles.commandCopy}
								feedback="icon"
								label="Copy the command"
								value={shownCommand}
							/>
						) : null}
					</div>
				)}
				{shownLines.map((line, index) => {
					const parts = split(line);

					return (
						<p key={`${active}-${line}-${index}`} className={styles.line} style={{ '--i': index } as CSSProperties}>
							{parts.box === '' ? null : <span className={styles.box}>{parts.box}</span>}
							{parts.spaces}
							{parts.glyph === '' ? null : (
								<span className={styles.glyph} data-tone={parts.tone ?? 'default'}>
									{parts.glyph}
								</span>
							)}
							<span className={styles.text}>{parts.text}</span>
						</p>
					);
				})}
			</div>
		</div>
	);
};

export default Terminal;
