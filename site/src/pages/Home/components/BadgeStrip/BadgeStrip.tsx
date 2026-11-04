import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import { BADGE_FACTS } from '@/pages/Home/constants/badge.constant';

import styles from './styles.module.css';

export interface BadgeStripProps extends ComponentProps<'section'> {}

const BadgeStrip = ({ className, ...props }: BadgeStripProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<ul className={styles.list}>
				{BADGE_FACTS.map((fact) => {
					return (
						<li key={fact.label} className={styles.item}>
							<span className={styles.label}>{fact.label}</span>
							<span className={styles.value}>{fact.value}</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
};

export default BadgeStrip;
