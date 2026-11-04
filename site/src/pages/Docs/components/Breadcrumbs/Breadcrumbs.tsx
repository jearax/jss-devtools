import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { NavLink, useLocation } from 'react-router';

import { DOCS_BASE_PATH, DOCS_PAGES } from '@/constants/routes.constant';

import styles from './styles.module.css';

export interface BreadcrumbsProps extends ComponentProps<'nav'> {}

const slugOf = (pathname: string): string => {
	return pathname.replace(`${DOCS_BASE_PATH}/`, '').replace(/\/$/, '');
};

/**
 * The page's place in the docs hierarchy: Docs, the group when the page has one, then the page
 * itself. Everything derives from the routes constant, so the breadcrumbs cannot disagree with
 * the sidebar, and the last crumb is the page, not a link.
 */
const Breadcrumbs = ({ className, ...props }: BreadcrumbsProps) => {
	const { pathname } = useLocation();

	const page = DOCS_PAGES.find((candidate) => {
		return candidate.slug === slugOf(pathname);
	});

	if (page === undefined) {
		return null;
	}

	return (
		<nav className={cn(styles.root, className)} aria-label="Breadcrumb" {...props}>
			<NavLink className={styles.link ?? ''} to={DOCS_BASE_PATH}>
				Docs
			</NavLink>
			{page.group === undefined ? null : (
				<>
					<span className={styles.sep} aria-hidden="true">
						/
					</span>
					<span>{page.group}</span>
				</>
			)}
			<span className={styles.sep} aria-hidden="true">
				/
			</span>
			<span aria-current="page">{page.title}</span>
		</nav>
	);
};

export default Breadcrumbs;
