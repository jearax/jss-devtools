import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import { LICENSE, SOURCE_LABEL, SOURCE_URL } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface SiteFooterProps extends ComponentProps<'footer'> {}

const SiteFooter = ({ className, ...props }: SiteFooterProps) => {
	return (
		<footer className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<p className={styles.credit}>Built by jjuidev</p>
				<div className={styles.fine}>
					<a className={styles.fineLink} href={SOURCE_URL} rel="noreferrer" target="_blank">
						{SOURCE_LABEL}
					</a>
					<span className={styles.fineItem}>{LICENSE} licensed</span>
				</div>
			</div>
		</footer>
	);
};

export default SiteFooter;
