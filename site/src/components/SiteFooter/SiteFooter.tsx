import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import { FOOTER_COLUMNS } from '@/components/SiteFooter/footer.constant';
import { LICENSE, SOURCE_LABEL, SOURCE_URL } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface SiteFooterProps extends ComponentProps<'footer'> {}

const SiteFooter = ({ className, ...props }: SiteFooterProps) => {
	return (
		<footer className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.columns}>
					{FOOTER_COLUMNS.map((column) => {
						return (
							<nav className={styles.column} aria-label={column.heading} key={column.heading}>
								<p className={styles.heading}>{column.heading}</p>
								<ul className={styles.list}>
									{column.links.map((link) => {
										return (
											<li key={link.label}>
												{link.external ? (
													<a className={styles.link} href={link.href} rel="noreferrer" target="_blank">
														{link.label}
													</a>
												) : (
													<Link className={styles.link} to={link.href}>
														{link.label}
													</Link>
												)}
											</li>
										);
									})}
								</ul>
							</nav>
						);
					})}
				</div>

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
