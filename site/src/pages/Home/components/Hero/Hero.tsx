import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import InstallBlock from '@/components/InstallBlock/InstallBlock';
import Terminal from '@/components/Terminal/Terminal';
import { CLI_VERSION, PRODUCT_NAME } from '@/constants/cli.constant';
import { HERO_TERMINAL_TABS, VALUE_LINES } from '@/pages/Home/Home.constant';

import styles from './styles.module.css';

export interface HeroProps extends ComponentProps<'section'> {}

const Hero = ({ className, ...props }: HeroProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.glow} aria-hidden="true" />
			<div className={styles.inner}>
				<div className={styles.copy}>
					<p className={styles.eyebrow}>
						{PRODUCT_NAME} <span className={styles.eyebrowVersion}>v{CLI_VERSION}</span>
					</p>
					<h1 className={styles.title}>
						<span className={styles.titleLine}>Set up the toolchain.</span>
						<span className={cn(styles.titleLine, styles.titleMuted)}>Teach your agent.</span>
					</h1>
					<p className={styles.value}>{VALUE_LINES[0]}</p>
					<InstallBlock />
					<p className={styles.next}>
						<Link className={styles.nextLink} to="/docs/getting-started">
							Then read the quickstart →
						</Link>
					</p>
				</div>
				<div className={styles.visual}>
					<Terminal
						className={styles.terminal}
						title={PRODUCT_NAME}
						variant="animated"
						replay
						fixedBody
						tabs={HERO_TERMINAL_TABS}
					/>
				</div>
			</div>
		</section>
	);
};

export default Hero;
