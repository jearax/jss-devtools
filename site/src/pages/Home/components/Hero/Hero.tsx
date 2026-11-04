import { Logo, cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import CodeBlock from '@/components/CodeBlock/CodeBlock';
import Terminal from '@/components/Terminal/Terminal';
import { INSTALL_COMMAND, NODE_FLOOR, PRODUCT_NAME, SOURCE_URL } from '@/constants/cli.constant';
import { HERO_TABS, TERMINAL_LABEL } from '@/constants/transcripts.constant';
import { VALUE_LINE, WORKS_WITH } from '@/pages/Home/Home.constant';

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

				<div className={styles.actions}>
					<a className={styles.primary} href="/docs/getting-started">
						Get started
					</a>
					<a className={styles.secondary} href={SOURCE_URL} rel="noreferrer" target="_blank">
						View on GitHub
					</a>
				</div>

				<div className={styles.install}>
					<CodeBlock code={INSTALL_COMMAND} language="sh" prompt="$" title="install.sh" wrap />
					<p className={styles.floor}>Requires Node {NODE_FLOOR}. Paste it in a terminal.</p>
				</div>

				<div className={styles.visual}>
					<Terminal
						className={styles.terminal}
						label={TERMINAL_LABEL}
						title="jss-devtools"
						tabs={HERO_TABS}
						variant="animated"
					/>
				</div>

				<div className={styles.worksWith}>
					<p className={styles.worksLabel}>Works inside</p>
					<ul className={styles.worksList}>
						{WORKS_WITH.map((item) => {
							return (
								<li key={item} className={styles.worksItem}>
									{item}
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</section>
	);
};

export default Hero;
