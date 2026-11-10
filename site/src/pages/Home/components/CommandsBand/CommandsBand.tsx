import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import RichText from '@/pages/Docs/components/RichText/RichText';
import { FEATURES } from '@/pages/Home/constants/feature.constant';

import styles from './styles.module.css';

export interface CommandsBandProps extends ComponentProps<'section'> {}

const CommandsBand = ({ className, ...props }: CommandsBandProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.head}>
				<p className={styles.eyebrow}>The commands</p>
				<h2 className={styles.title}>
					Three commands, <span className={styles.titleMuted}>one job each.</span>
				</h2>
			</div>

			<div className={styles.row}>
				{FEATURES.map((feature) => {
					return (
						/*
						 * The column is the link: the whole surface answers, the hairlines do the
						 * dividing, and the accessible name is the affordance the column shows.
						 */
						<Link
							key={feature.name}
							to={feature.href}
							className={styles.column}
							aria-label={`Read the ${feature.name} docs`}
						>
							<h3 className={styles.command}>{feature.command}</h3>
							<p className={styles.summary}>
								<RichText text={feature.summary} />
							</p>
							<p className={styles.details}>
								<RichText text={feature.details} />
							</p>
							<span className={styles.link}>
								<span className={styles.linkText}>Read the {feature.name} docs</span>
								<span className={styles.arrow} aria-hidden="true">
									→
								</span>
							</span>
						</Link>
					);
				})}
			</div>
		</section>
	);
};

export default CommandsBand;
