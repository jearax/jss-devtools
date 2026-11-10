import { cn } from '@jjuidev/styles/variants';
import { RotateCcw } from 'lucide-react';
import {
	AnimationEvent,
	ComponentProps,
	CSSProperties,
	KeyboardEvent,
	useEffect,
	useId,
	ReactNode,
	useRef,
	useState
} from 'react';

import CopyButton from '@/components/CopyButton/CopyButton';
import ShellCommand from '@/components/ShellCommand/ShellCommand';
import ShellPrompt, { ShellPromptProps } from '@/components/ShellPrompt/ShellPrompt';
import { parseAnsi } from '@/components/Terminal/ansi.util';
import WindowChrome from '@/components/WindowChrome/WindowChrome';

import styles from './styles.module.css';

export type TerminalTab = {
	/** The simulated working directory the tab shows, the way a real terminal tab names its cwd. */
	label: string;
	/** The shell comment the transcript opens with: the tab's purpose, in the terminal's own voice. */
	comment?: string;
	command?: string;
	/** Where the command runs, when it is not inside the project. */
	prompt?: Pick<ShellPromptProps, 'dir' | 'git'>;
	/** Commands already run in this window, shown finished above the one being typed. */
	history?: readonly { prompt?: Pick<ShellPromptProps, 'dir' | 'git'>; command: string }[];
	lines?: readonly string[];
	/** A full-screen program's view, shown after the command instead of output lines. */
	screen?: ReactNode;
	/** Moves to the next tab once this tab's replay has finished. */
	advance?: boolean;
};

// How long a finished replay stays on screen before the window moves to the next tab.
const ADVANCE_DELAY_MS = 800;

export type TerminalProps = ComponentProps<'div'> & {
	/** The window's title: the command, or the folder the terminal sits in. */
	title?: string;
	/** A note on the right of the title bar, for a transcript that is an example, not a promise. */
	label?: string;
	/** The command line, typed out in the animated variant. */
	command?: string;
	/** The shell comment above the command, for a window with a single transcript. */
	comment?: string;
	/** The CLI's output, one string per line, with its real glyphs. */
	lines?: readonly string[];
	/** The transcripts the reader switches between. */
	tabs?: readonly TerminalTab[];
	/** The name of the tab list, for a screen reader. */
	tabListLabel?: string;
	/** `animated` types the command and reveals the output; `static` shows the final state. */
	variant?: 'static' | 'animated';
	/** Shows a replay control; the animated variant only, the static one is already finished. */
	replay?: boolean;
	/** Pins the body to a fixed height at the desktop so switching tabs never shifts the page. */
	fixedBody?: boolean;
	/**
	 * Puts an icon-only copy button at the right end of the command row, copying the shown
	 * command. The interaction follows the design system's `ButtonCopy` with `feedback="icon"`:
	 * the icon swaps Copy→Check for two seconds, and a screen-reader line says so.
	 */
	commandCopy?: boolean;
};

const Terminal = ({
	className,
	title,
	label,
	command,
	comment,
	lines,
	tabs,
	tabListLabel = 'Replay transcripts',
	variant = 'static',
	replay = false,
	fixedBody = false,
	commandCopy = false,
	...props
}: TerminalProps) => {
	const [active, setActive] = useState(0);
	const [run, setRun] = useState(0);
	const baseId = useId();
	const tab = tabs?.[active];
	const shownCommand = tab?.command ?? command;
	const shownComment = tab?.comment ?? comment;
	const shownLines = tab?.lines ?? lines ?? [];

	// Commands type one after another; the output follows the last of them.
	const commandRows = [
		...(tab?.history ?? []),
		...(shownCommand
			? [
					{
						prompt: tab?.prompt,
						command: shownCommand
					}
				]
			: [])
	];

	const body = useRef<HTMLDivElement>(null);

	// A replay starts at the top; under reduced motion it is already finished, so it shows the end.
	useEffect(() => {
		const element = body.current;

		if (element === null || variant !== 'animated') {
			return;
		}

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		element.scrollTop = reduced ? element.scrollHeight : 0;
	}, [variant, run, active]);

	const advanceTimer = useRef<number | undefined>(undefined);

	// A tab switch or a replay cancels the pending move, so a reader's own choice always wins.
	useEffect(() => {
		return () => {
			window.clearTimeout(advanceTimer.current);
		};
	}, [active, run]);

	// The last line's reveal ending is the replay ending; under reduced motion nothing animates, so nothing moves.
	const onRevealEnd = (event: AnimationEvent<HTMLDivElement>) => {
		const count = tabs?.length ?? 0;

		if (!tab?.advance || count < 2 || event.target !== body.current?.lastElementChild) {
			return;
		}

		advanceTimer.current = window.setTimeout(() => {
			setActive((current) => {
				return (current + 1) % count;
			});
		}, ADVANCE_DELAY_MS);
	};

	// Follows the output like a real terminal: each line that starts to appear is scrolled into view.
	const onLineAppear = (event: AnimationEvent<HTMLDivElement>) => {
		const element = body.current;
		const line = event.target;

		if (element === null || !(line instanceof HTMLElement) || !line.classList.contains(styles.line ?? '')) {
			return;
		}

		const padding = Number.parseFloat(getComputedStyle(element).paddingBottom);
		const bottom = line.offsetTop + line.offsetHeight + padding - element.clientHeight;

		if (bottom > element.scrollTop) {
			element.scrollTo({
				top: bottom,
				behavior: 'smooth'
			});
		}
	};

	const panelProps = tabs && {
		role: 'tabpanel',
		id: `${baseId}-panel-${active}`,
		'aria-labelledby': `${baseId}-tab-${active}`
	};

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
		<div className={cn(styles.root, className)} data-variant={variant} data-fixed-body={fixedBody} {...props}>
			<WindowChrome title={title}>{label && <span className={styles.label}>{label}</span>}</WindowChrome>

			{tabs && (
				<div className={styles.tabs} role="tablist" aria-label={tabListLabel}>
					{tabs.map((item, index) => {
						return (
							<button
								key={`${index}-${item.label}`}
								type="button"
								role="tab"
								id={`${baseId}-tab-${index}`}
								aria-selected={index === active}
								aria-controls={`${baseId}-panel-${index}`}
								tabIndex={index === active ? 0 : -1}
								className={styles.tab}
								data-selected={index === active}
								onClick={() => {
									setActive(index);
									setRun((run) => {
										return run + 1;
									});
								}}
								onKeyDown={(event) => {
									onTabKeyDown(event, index);
								}}
							>
								{item.label}
							</button>
						);
					})}
					{replay && variant === 'animated' ? (
						<button
							type="button"
							className={styles.replay}
							aria-label="Replay the transcript"
							onClick={() => {
								setRun((run) => {
									return run + 1;
								});
							}}
						>
							<RotateCcw className={styles.replayIcon} size={13} aria-hidden="true" />
						</button>
					) : null}
				</div>
			)}

			<div
				ref={body}
				className={styles.body}
				style={{ '--steps': Math.max(commandRows.length - 1, 0) } as CSSProperties}
				onAnimationStart={onLineAppear}
				onAnimationEnd={onRevealEnd}
				{...panelProps}
			>
				{shownComment && (
					<p key={`${run}-${shownComment}`} className={styles.comment}>
						{`# ${shownComment}`}
					</p>
				)}
				{commandRows.map((entry, step) => {
					const last = step === commandRows.length - 1;

					return (
						<div
							key={`${run}-${active}-${step}`}
							className={styles.commandRow}
							style={{ '--step': step } as CSSProperties}
						>
							<ShellPrompt className={styles.prompt} {...entry.prompt} />
							<p
								className={styles.command}
								data-last={last}
								style={{ '--chars': entry.command.length } as CSSProperties}
							>
								<ShellCommand command={entry.command} />
							</p>
							{commandCopy && last && (
								<CopyButton
									className={styles.commandCopy}
									feedback="icon"
									label="Copy the command"
									value={entry.command}
								/>
							)}
						</div>
					);
				})}
				{tab?.screen && (
					<div
						key={`${run}-${active}-screen`}
						className={cn(styles.line, styles.screen)}
						style={{ '--i': 0 } as CSSProperties}
					>
						{tab.screen}
					</div>
				)}
				{shownLines.map((line, index) => {
					return (
						<p
							key={`${run}-${active}-${index}-${line}`}
							className={styles.line}
							style={{ '--i': index } as CSSProperties}
						>
							{parseAnsi(line).map((segment, segmentIndex) => {
								return (
									<span
										key={segmentIndex}
										className={styles.segment}
										data-color={segment.color ?? undefined}
										data-dim={segment.dim || undefined}
										data-bold={segment.bold || undefined}
										data-inverse={segment.inverse || undefined}
									>
										{segment.text}
									</span>
								);
							})}
						</p>
					);
				})}
			</div>
		</div>
	);
};

export default Terminal;
