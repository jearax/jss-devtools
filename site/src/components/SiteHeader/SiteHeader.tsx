import { Button, Logo, ThemeToggle, cn } from '@jjuidev/design-system';
import { Menu, X } from 'lucide-react';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';

import SearchTrigger from '@/components/SearchTrigger/SearchTrigger';
import { NAV_ITEMS } from '@/constants/routes.constant';
import { THEME_OPTION_LABELS, THEME_TOGGLE_LABEL } from '@/constants/theme.constant';

import styles from './styles.module.css';

export interface SiteHeaderProps extends ComponentProps<'header'> {}

const SiteHeader = ({ className, ...props }: SiteHeaderProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
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

					<nav className={styles.nav} aria-label="Main">
						<ul className={styles.navList}>
							{NAV_ITEMS.map((item) => {
								return (
									<li key={item.label} className={styles.navItem}>
										{item.external ? (
											<a className={styles.navLink} href={item.href} rel="noreferrer" target="_blank">
												{item.label}
											</a>
										) : (
											<NavLink className={styles.navLink ?? ''} to={item.href}>
												{item.label}
											</NavLink>
										)}
									</li>
								);
							})}
						</ul>
					</nav>

					<div className={styles.actions}>
						<div className={styles.search}>
							<SearchTrigger />
						</div>
						<a className={styles.cta} href="/docs/install">
							Install
						</a>
						<ThemeToggle className={styles.themeToggle} label={THEME_TOGGLE_LABEL} optionLabels={THEME_OPTION_LABELS} />
						<Button
							className={styles.menuButton}
							variant="ghost"
							size="icon"
							aria-controls="site-menu"
							aria-expanded={isMenuOpen}
							aria-label={isMenuOpen ? 'Close the menu' : 'Open the menu'}
							onClick={() => {
								setIsMenuOpen((open) => {
									return !open;
								});
							}}
						>
							{isMenuOpen ? <X size={18} /> : <Menu size={18} />}
						</Button>
					</div>
				</div>

				<div className={styles.panel} id="site-menu" data-open={isMenuOpen ? 'true' : 'false'} inert={!isMenuOpen}>
					<div className={styles.panelInner}>
						<ul className={styles.panelList}>
							{NAV_ITEMS.map((item) => {
								return (
									<li key={item.label} className={styles.navItem}>
										{item.external ? (
											<a className={styles.panelLink} href={item.href} rel="noreferrer" target="_blank">
												{item.label}
											</a>
										) : (
											<NavLink className={styles.panelLink ?? ''} to={item.href}>
												{item.label}
											</NavLink>
										)}
									</li>
								);
							})}
						</ul>
						<div className={styles.panelSearch}>
							<SearchTrigger />
						</div>
					</div>
				</div>
			</header>
		</>
	);
};

export default SiteHeader;
