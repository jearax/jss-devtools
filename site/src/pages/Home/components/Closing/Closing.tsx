import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import { INSTALL_COMMAND, LICENSE, SOURCE_URL } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface ClosingProps extends ComponentProps<'section'> {}

const Closing = ({ className, ...props }: ClosingProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<h2 className={styles.title}>
					Give your agent the rules. <span className={styles.titleMuted}>Give yourself the toolchain.</span>
				</h2>

				<code className={styles.command}>
					<span className={styles.prompt}>$</span> {INSTALL_COMMAND}
				</code>

				<div className={styles.actions}>
					<a className={styles.primary} href="/docs/getting-started">
						Get started
					</a>
					<a className={styles.secondary} href={SOURCE_URL} rel="noreferrer" target="_blank">
						View on GitHub
					</a>
				</div>

				<p className={styles.note}>
					{LICENSE} licensed. Read the{' '}
					<a className={styles.noteLink} href="/docs">
						docs
					</a>{' '}
					for the flags and the files the CLI touches.
				</p>
			</div>
		</section>
	);
};

export default Closing;
