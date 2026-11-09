import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import RichText from '@/pages/Docs/components/RichText/RichText';
import { FEATURES } from '@/pages/Home/constants/feature.constant';

import styles from './styles.module.css';

export interface FeatureRowProps extends ComponentProps<'section'> {}

const FeatureRow = ({ className, ...props }: FeatureRowProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<p className={styles.eyebrow}>The commands</p>
					<h2 className={styles.title}>
						Three commands, <span className={styles.titleMuted}>one job each.</span>
					</h2>
				</div>

				<div className={styles.row}>
					{FEATURES.map((feature) => {
						const Icon = feature.icon;

						return (
							/*
							 * The card is the link: one interactive surface per command, named after the
							 * docs affordance the card shows, so the accessible name stays short while
							 * the whole card answers a click.
							 */
							<Link
								key={feature.name}
								to={feature.href}
								className={styles.card}
								aria-label={`Read the ${feature.name} docs`}
							>
								<div className={styles.cardHead}>
									{Icon === undefined ? null : (
										<span className={styles.icon} aria-hidden="true">
											<Icon size={18} strokeWidth={1.75} />
										</span>
									)}
									<h3 className={styles.command}>{feature.name}</h3>
								</div>

								<p className={styles.summary}>
									<RichText text={feature.summary} />
								</p>
								<p className={styles.details}>
									<RichText text={feature.details} />
								</p>

								<span className={styles.link}>
									Read the {feature.name} docs
									<span className={styles.arrow} aria-hidden="true">
										→
									</span>
								</span>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default FeatureRow;
