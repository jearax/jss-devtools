import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import { LICENSE, NODE_FLOOR, REQUIREMENTS, SOURCE_LABEL } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface RequirementsProps extends ComponentProps<'section'> {}

const Requirements = ({ className, ...props }: RequirementsProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<h2 className={styles.title}>What it needs</h2>
					<p className={styles.lead}>
						Nothing beyond Node and a shell. The floor is enforced at install and checked again by{' '}
						<code className={styles.inlineCode}>doctor</code>.
					</p>
				</div>

				<ul className={styles.list}>
					{REQUIREMENTS.map((requirement) => {
						return (
							<li key={requirement} className={styles.item}>
								{requirement}
							</li>
						);
					})}
				</ul>

				<dl className={styles.facts}>
					<div className={styles.fact}>
						<dt className={styles.factLabel}>Node</dt>
						<dd className={styles.factValue}>{NODE_FLOOR}</dd>
					</div>
					<div className={styles.fact}>
						<dt className={styles.factLabel}>License</dt>
						<dd className={styles.factValue}>{LICENSE}</dd>
					</div>
					<div className={styles.fact}>
						<dt className={styles.factLabel}>Source</dt>
						<dd className={styles.factValue}>{SOURCE_LABEL}</dd>
					</div>
				</dl>
			</div>
		</section>
	);
};

export default Requirements;
