import { cn } from '@jjuidev/styles/variants';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ComponentProps } from 'react';
import { Link, useLocation } from 'react-router';

import { DOCS_BASE_PATH, DOCS_PAGES, docsHref } from '@/constants/routes.constant';

import styles from './styles.module.css';

export interface PagerProps extends ComponentProps<'nav'> {}

/**
 * The page's place in the docs order, read from the path. The order itself lives in the routes
 * constant, so the sidebar and the pager cannot disagree about what comes next.
 */
const slugOf = (pathname: string): string => {
	return pathname.replace(`${DOCS_BASE_PATH}/`, '').replace(/\/$/, '');
};

const Pager = ({ className, ...props }: PagerProps) => {
	const { pathname } = useLocation();

	const index = DOCS_PAGES.findIndex((page) => {
		return page.slug === slugOf(pathname);
	});

	const previous = index > 0 ? (DOCS_PAGES[index - 1] ?? null) : null;
	const next = index >= 0 && index < DOCS_PAGES.length - 1 ? (DOCS_PAGES[index + 1] ?? null) : null;

	if (previous === null && next === null) {
		return null;
	}

	return (
		<nav className={cn(styles.root, className)} aria-label="The neighbouring pages" {...props}>
			{previous && (
				<Link className={styles.link} to={docsHref(previous.slug)}>
					<span className={styles.direction}>
						<ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
						Previous
					</span>
					<span className={styles.title}>{previous.title}</span>
				</Link>
			)}
			{next && (
				<Link className={cn(styles.link, styles.next)} to={docsHref(next.slug)}>
					<span className={styles.direction}>
						Next
						<ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
					</span>
					<span className={styles.title}>{next.title}</span>
				</Link>
			)}
		</nav>
	);
};

export default Pager;
