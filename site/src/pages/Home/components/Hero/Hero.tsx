import { Logo, cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import CopyButton from '@/components/CopyButton/CopyButton';
import Terminal from '@/components/Terminal/Terminal';
import { INSTALL_COMMAND, PRODUCT_NAME, SOURCE_URL } from '@/constants/cli.constant';
import { VALUE_LINE } from '@/pages/Home/Home.constant';

import styles from './styles.module.css';

export interface HeroProps extends ComponentProps<'section'> {}

const Hero = ({ className, ...props }: HeroProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.mark} aria-hidden="true">
				<Logo />
			</div>

			<div className={styles.inner}>
				<p className={styles.eyebrow}>{PRODUCT_NAME}</p>
				<h1 className={styles.title}>
					Set up the toolchain. <span className={styles.titleMuted}>Teach your agent.</span>
				</h1>
				<p className={styles.value}>{VALUE_LINE}</p>

				<div className={styles.visual}>
					<Terminal className={styles.terminal} command={INSTALL_COMMAND} title="install.sh" variant="static" />

					{/* The copy button sits under the window it copies, so it never covers the command. */}
					<div className={styles.install}>
						<CopyButton label="Copy the install command" value={INSTALL_COMMAND} />
					</div>
				</div>

				<div className={styles.actions}>
					<a className={styles.primary} href="/docs/getting-started">
						Get started
					</a>
					<a className={styles.secondary} href={SOURCE_URL} rel="noreferrer" target="_blank">
						View on GitHub
					</a>
				</div>
			</div>
		</section>
	);
};

export default Hero;
