import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

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
							<article key={feature.name} className={styles.card}>
								<div className={styles.cardHead}>
									{Icon === undefined ? null : (
										<span className={styles.icon} aria-hidden="true">
											<Icon size={18} strokeWidth={1.75} />
										</span>
									)}
									<h3 className={styles.command}>{feature.name}</h3>
								</div>

								<p className={styles.summary}>{feature.summary}</p>
								<p className={styles.details}>{feature.details}</p>

								<a className={styles.link} href={feature.href}>
									Read the {feature.name} docs
									<span className={styles.arrow} aria-hidden="true">
										→
									</span>
								</a>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default FeatureRow;
