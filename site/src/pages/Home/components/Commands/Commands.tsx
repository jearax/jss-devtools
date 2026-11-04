import { cn } from '@jjuidev/design-system';
import { Bot, FolderPlus, Stethoscope } from 'lucide-react';
import { ComponentProps } from 'react';

import Terminal from '@/components/Terminal/Terminal';
import { COMMANDS } from '@/constants/commands.constant';
import { DOCTOR_TRANSCRIPT, HARNESS_TRANSCRIPT, INIT_TRANSCRIPT } from '@/constants/transcripts.constant';

import styles from './styles.module.css';

export interface CommandsProps extends ComponentProps<'section'> {}

/*
 * The transcript belongs to its command by name, not by position: a card that moves would
 * otherwise show another command's output.
 */
const TRANSCRIPT_BY_COMMAND: Record<string, readonly string[]> = {
	init: INIT_TRANSCRIPT,
	doctor: DOCTOR_TRANSCRIPT,
	harness: HARNESS_TRANSCRIPT
};

/** One icon per command, so a card reads as a thing and not as a paragraph. */
const ICON_BY_COMMAND = {
	init: FolderPlus,
	doctor: Stethoscope,
	harness: Bot
} as const;

const Commands = ({ className, ...props }: CommandsProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<p className={styles.eyebrow}>The commands</p>
					<h2 className={styles.title}>
						Three commands, <span className={styles.titleMuted}>one job each.</span>
					</h2>
				</div>
				<div className={styles.bento}>
					{COMMANDS.map((card) => {
						const Icon = ICON_BY_COMMAND[card.name as keyof typeof ICON_BY_COMMAND];

						return (
							<article key={card.name} className={styles.tile} data-wide={card.name === 'init' ? 'true' : undefined}>
								<div className={styles.tileHead}>
									<div className={styles.tileTitle}>
										{Icon === undefined ? null : (
											<span className={styles.icon} aria-hidden="true">
												<Icon size={18} strokeWidth={1.75} />
											</span>
										)}
										<h3 className={styles.command}>{card.name}</h3>
									</div>
									<p className={styles.summary}>{card.summary}</p>
								</div>
								<div className={styles.tileBody}>
									<code className={styles.commandLine}>{card.command}</code>
									<Terminal
										className={styles.terminal}
										lines={TRANSCRIPT_BY_COMMAND[card.name] ?? []}
										title={card.name}
									/>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default Commands;
