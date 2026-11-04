import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { NavLink } from 'react-router';

import { DOCS_SIDEBAR_GROUPS, DocsSidebarGroup, docsHref } from '@/constants/routes.constant';

import styles from './styles.module.css';

export interface SidebarProps extends ComponentProps<'nav'> {}

/** One group's pages; the group's label is a header when it is one, and never a link. */
const Group = ({ group, indented }: { group: DocsSidebarGroup; indented: boolean }) => {
	return (
		<li className={styles.group}>
			{group.label === null ? null : <p className={styles.groupLabel}>{group.label}</p>}
			<ul className={indented ? styles.sublist : styles.pages}>
				{group.pages.map((page) => {
					return (
						<li key={page.slug}>
							<NavLink className={styles.link ?? ''} to={docsHref(page.slug)}>
								{page.title}
							</NavLink>
						</li>
					);
				})}
			</ul>
		</li>
	);
};

const Sidebar = ({ className, ...props }: SidebarProps) => {
	return (
		<nav className={cn(styles.root, className)} aria-label="The docs pages" {...props}>
			<p className={styles.label}>Docs</p>
			<ul className={styles.list}>
				{DOCS_SIDEBAR_GROUPS.map((group) => {
					return <Group indented={group.label !== null} group={group} key={group.label ?? 'top'} />;
				})}
			</ul>
		</nav>
	);
};

export default Sidebar;
