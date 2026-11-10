import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, CSSProperties } from 'react';

import styles from './styles.module.css';

export interface ClaudeCodeScreenProps extends ComponentProps<'div'> {}

// Typed into the input after the screen appears; the CSS times the typing by its length.
const PROMPT = 'Hi! What should I do first here?';

// Seconds after the screen appears; the CSS turns them into delays.
const at = (seconds: number) => {
	return { '--t': `${seconds}s` } as CSSProperties;
};

// Claude Code's start screen in the project init just created, drawn in text; no Anthropic artwork.
// The session runs as far as the harness asking to onboard, which is what init leaves pending.
const ClaudeCodeScreen = ({ className, ...props }: ClaudeCodeScreenProps) => {
	return (
		<div className={cn(styles.root, className)} style={{ '--chars': PROMPT.length } as CSSProperties} {...props}>
			<div className={styles.log}>
				<div className={styles.head}>
					<p>
						<span className={styles.product}>Claude Code</span> <span className={styles.muted}>v2.1.321</span>
					</p>
					<p className={styles.muted}>Fable 5.2 with max effort · Claude Max</p>
					<p className={styles.muted}>~/my-app</p>
				</div>

				<div className={styles.turn} style={at(2.8)}>
					<p className={styles.prompt}>❯ {PROMPT}</p>
				</div>

				<div className={styles.turn} style={at(3.6)}>
					<div>
						<p>
							<span className={styles.bullet}>●</span> Onboard the harness first:{' '}
							<span className={styles.path}>.harness/BOOTSTRAP.md</span> is still here, so the repo has no recorded
							knowledge yet.
						</p>
					</div>
				</div>

				<div className={styles.turn} style={at(4.5)}>
					<div>
						<p>
							<span className={styles.muted}>●</span> Ran 1 stop hook
						</p>
						<p className={cn(styles.indent, styles.muted)}>
							⎿ Onboarding pending: .harness/BOOTSTRAP.md is present — run the harness-onboard skill.
						</p>
					</div>
				</div>

				<div className={styles.turn} style={at(5.2)}>
					<div>
						<p>
							<span className={styles.done}>●</span> <span className={styles.product}>Skill</span>(harness-onboard)
						</p>
						<p className={cn(styles.indent, styles.muted)}>⎿ Successfully loaded skill</p>
					</div>
				</div>

				<div className={styles.turn} style={at(6.1)}>
					<div className={styles.question}>
						<p>
							<span className={styles.chip}>☐ Onboard</span>
						</p>
						<p className={styles.product}>Run harness onboarding now?</p>
						<p>
							<span className={styles.option}>❯ 1. Onboard now (Recommended)</span>
						</p>
						<p className={styles.indent}>
							<span className={styles.muted}>Read the repo and write what it learns to .harness/.</span>
						</p>
						<p className={styles.indent}>2. Later</p>
					</div>
				</div>
			</div>

			<div className={styles.foot}>
				<p className={styles.input}>
					<span className={styles.chevron}>❯</span> <span className={styles.typed}>{PROMPT}</span>
					<span className={styles.choice} data-reveal-end>
						1
					</span>
					<span className={styles.caret} aria-hidden="true" />
					<span className={styles.placeholder}>
						<span className={styles.caretOn}>T</span>ry &quot;fix lint errors&quot;
					</span>
				</p>

				<div className={styles.status}>
					<p>
						<span className={styles.cwd}>cwd: ~/my-app</span> <span className={styles.branch}>⎇ main</span>
					</p>
					<p>
						<span className={styles.model}>Model: Fable 5.2</span>{' '}
						<span className={styles.thinking}>Thinking: max</span>{' '}
						<span className={styles.context}>Context: 0/1.0M (0%)</span>
					</p>
					<p className={styles.usage}>
						Session: <span className={styles.usageValue}>1.0% (04:59)</span> · Weekly:{' '}
						<span className={styles.usageValue}>0.0% (6d 23h)</span>
					</p>
					<p>
						<span className={styles.mode}>⏵⏵ bypass permissions on</span>{' '}
						<span className={styles.muted}>(shift+tab to cycle)</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default ClaudeCodeScreen;
