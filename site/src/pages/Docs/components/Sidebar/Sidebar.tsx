import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, useState } from 'react';
import { NavLink } from 'react-router';

import { DOCS_SIDEBAR_GROUPS, DocsSidebarGroup, docsHref } from '@/constants/routes.constant';

import styles from './styles.module.css';

export interface SidebarProps extends ComponentProps<'nav'> {}

/** One group's pages; the group's label is a header when it is one, and never a link. */
const Group = ({ group, indented }: { group: DocsSidebarGroup; indented: boolean }) => {
	return (
		<li className={styles.group}>
			{group.label && <p className={styles.groupLabel}>{group.label}</p>}
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
	const [open, setOpen] = useState(false);

	return (
		<nav className={cn(styles.root, className)} aria-label="The docs pages" {...props}>
			{/*
			 * On the wide layout the nav shows outright; below lg the same content folds behind a
			 * button, so no overlay layer is needed to reach every page.
			 */}
			<button
				type="button"
				className={styles.drawerSummary}
				aria-expanded={open}
				onClick={() => {
					setOpen((value) => {
						return !value;
					});
				}}
			>
				Docs
			</button>
			<ul className={styles.list} data-open={open}>
				{DOCS_SIDEBAR_GROUPS.map((group) => {
					// The label names the group; the labelless top-level groups take their first page's
					// slug, so no two groups ever share a key.
					return <Group indented={group.label !== null} group={group} key={group.label ?? group.pages[0]?.slug} />;
				})}
			</ul>
		</nav>
	);
};

export default Sidebar;
