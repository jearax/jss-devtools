import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import { LICENSE, SOURCE_LABEL, SOURCE_URL } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface SiteFooterProps extends ComponentProps<'footer'> {}

const SiteFooter = ({ className, ...props }: SiteFooterProps) => {
	return (
		<footer className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<p className={styles.source}>
					Source:{' '}
					<a className={styles.sourceLink} href={SOURCE_URL}>
						{SOURCE_LABEL}
					</a>
				</p>
				<p className={styles.license}>{LICENSE} licensed</p>
			</div>
		</footer>
	);
};

export default SiteFooter;
