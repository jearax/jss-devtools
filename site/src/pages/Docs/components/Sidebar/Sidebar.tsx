import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { NavLink } from 'react-router';

import { DOCS_PAGES, docsHref } from '@/constants/routes.constant';

import styles from './styles.module.css';

export interface SidebarProps extends ComponentProps<'nav'> {}

const Sidebar = ({ className, ...props }: SidebarProps) => {
	return (
		<nav className={cn(styles.root, className)} aria-label="The docs pages" {...props}>
			<p className={styles.label}>Docs</p>
			<ul className={styles.list}>
				{DOCS_PAGES.map((page) => {
					return (
						<li key={page.slug}>
							<NavLink className={styles.link ?? ''} to={docsHref(page.slug)}>
								{page.title}
							</NavLink>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

export default Sidebar;
