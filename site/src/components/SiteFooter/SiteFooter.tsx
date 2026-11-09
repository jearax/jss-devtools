import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import { PRODUCT_NAME, SOURCE_URL } from '@/constants/cli.constant';
import { docsHref } from '@/constants/routes.constant';

import styles from './styles.module.css';

export interface SiteFooterProps extends ComponentProps<'footer'> {}

const SiteFooter = ({ className, ...props }: SiteFooterProps) => {
	return (
		<footer className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<p className={styles.name}>{PRODUCT_NAME}</p>

				<nav className={styles.links} aria-label="The footer links">
					<Link className={styles.link} to={docsHref('getting-started')}>
						Docs
					</Link>
					<a className={styles.link} href={SOURCE_URL} rel="noreferrer" target="_blank">
						GitHub
					</a>
				</nav>

				<p className={styles.licence}>MIT licence</p>
			</div>
		</footer>
	);
};

export default SiteFooter;
