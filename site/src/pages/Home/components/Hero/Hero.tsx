import { Logo, cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import Terminal from '@/components/Terminal/Terminal';
import { PRODUCT_NAME } from '@/constants/cli.constant';
import { HERO_TERMINAL_TABS, VALUE_LINES } from '@/pages/Home/Home.constant';

import styles from './styles.module.css';

export interface HeroProps extends ComponentProps<'section'> {}

const Hero = ({ className, ...props }: HeroProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.mark} aria-hidden="true">
				<Logo />
			</div>

			<div className={styles.inner}>
				<h1 className={styles.title}>
					<span className={styles.titleLine}>Set up the toolchain.</span>
					<span className={cn(styles.titleLine, styles.titleMuted)}>Teach your agent.</span>
				</h1>
				<p className={styles.value}>
					{VALUE_LINES.map((line) => {
						return (
							<span key={line} className={styles.valueLine}>
								{line}
							</span>
						);
					})}
				</p>

				<div className={styles.visual}>
					<Terminal
						className={styles.terminal}
						title={PRODUCT_NAME}
						variant="animated"
						commandCopy
						tabs={HERO_TERMINAL_TABS}
					/>
				</div>

				<div className={styles.cta}>
					{/*
					 * The package's Button has no link composition yet, so the link wears the package's
					 * own solid large button recipe, utility by utility, and keeps the router's client
					 * side navigation.
					 */}
					<Link className={styles.ctaButton} to="/docs/getting-started">
						Getting started
					</Link>
				</div>
			</div>
		</section>
	);
};

export default Hero;
