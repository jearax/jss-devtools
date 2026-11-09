import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import Terminal from '@/components/Terminal/Terminal';
import { PRODUCT_NAME } from '@/constants/cli.constant';
import { HERO_TERMINAL_TABS, VALUE_LINES } from '@/pages/Home/Home.constant';

import styles from './styles.module.css';

export interface HeroProps extends ComponentProps<'section'> {}

const Hero = ({ className, ...props }: HeroProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
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
			</div>
		</section>
	);
};

export default Hero;
