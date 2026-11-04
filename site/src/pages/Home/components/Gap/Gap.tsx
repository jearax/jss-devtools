import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import styles from './styles.module.css';

export interface GapProps extends ComponentProps<'section'> {}

const Gap = ({ className, ...props }: GapProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<p className={styles.eyebrow}>The gap</p>
				<h2 className={styles.statement}>
					Your agent can read your code. <span className={styles.statementMuted}>It cannot read your rules.</span>
				</h2>
				<p className={styles.text}>
					The repository, not the chat context, is the authority an agent works from. So the harness gives the agent the
					repository&rsquo;s decisions, its memory and its own plan &mdash; and the toolchain that keeps the repository
					honest while the agent works in it.
				</p>
			</div>
		</section>
	);
};

export default Gap;
