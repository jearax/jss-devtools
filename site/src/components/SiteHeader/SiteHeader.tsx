import { Logo, ThemeToggle, cn } from '@jjuidev/design-system';
import { ComponentProps, useEffect, useRef, useState } from 'react';

import SearchTrigger from '@/components/SearchTrigger/SearchTrigger';
import { SOURCE_URL } from '@/constants/cli.constant';
import { THEME_OPTION_LABELS, THEME_TOGGLE_LABEL } from '@/constants/theme.constant';

import styles from './styles.module.css';

export interface SiteHeaderProps extends ComponentProps<'header'> {}

/*
 * The GitHub mark. lucide-react dropped brand icons in v1, so the mark comes from GitHub's own
 * octicon set (MIT) instead of an icon package.
 */
const GITHUB_MARK_PATH =
	'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

const SiteHeader = ({ className, ...props }: SiteHeaderProps) => {
	const [isScrolled, setIsScrolled] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);

	/*
	 * The sentinel is a zero-height element at the top of the page. An observer on it tells the
	 * header whether the page has scrolled past the top, so the bar can raise its surface.
	 * An observer rather than a scroll listener: the callback fires only when the crossing
	 * happens, not on every frame of a scroll.
	 */
	useEffect(() => {
		const sentinel = sentinelRef.current;

		if (sentinel === null) {
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			const entry = entries[0];

			if (entry === undefined) {
				return;
			}

			setIsScrolled(!entry.isIntersecting);
		});

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<>
			<div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
			<header className={cn(styles.root, className)} data-scrolled={isScrolled ? 'true' : undefined} {...props}>
				<div className={styles.inner}>
					{/*
					 * The link is named by the mark's own wordmark. An aria-label here would replace it, and
					 * a name that does not contain the visible text is a mismatch a screen reader announces
					 * as a different thing than the one on screen.
					 */}
					<a className={styles.brand} href="/">
						<Logo expanded />
					</a>

					<div className={styles.actions}>
						<SearchTrigger className={styles.search} />
						<a className={styles.github} href={SOURCE_URL} rel="noreferrer" target="_blank" aria-label="View on GitHub">
							<svg className={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d={GITHUB_MARK_PATH} />
							</svg>
						</a>
						<ThemeToggle className={styles.themeToggle} label={THEME_TOGGLE_LABEL} optionLabels={THEME_OPTION_LABELS} />
					</div>
				</div>
			</header>
		</>
	);
};

export default SiteHeader;
