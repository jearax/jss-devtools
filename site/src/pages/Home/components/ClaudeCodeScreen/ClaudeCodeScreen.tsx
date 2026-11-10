import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import styles from './styles.module.css';

export interface ClaudeCodeScreenProps extends ComponentProps<'div'> {}

// Claude Code's start screen in the project init just created, drawn in text; no Anthropic artwork.
const ClaudeCodeScreen = ({ className, ...props }: ClaudeCodeScreenProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<div className={styles.head}>
				<p>
					<span className={styles.product}>Claude Code</span> <span className={styles.muted}>v2.1.321</span>
				</p>
				<p className={styles.muted}>Fable 5.2 with max effort · Claude Max</p>
				<p className={styles.muted}>~/my-app</p>
			</div>

			<div className={styles.foot}>
				<p className={styles.input}>
					<span className={styles.chevron}>❯</span>{' '}
					<span className={styles.muted}>Try &quot;fix lint errors&quot;</span>
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
