import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';
import { Outlet } from 'react-router';

import BackToTop from '@/components/BackToTop/BackToTop';
import SearchPalette from '@/components/SearchPalette/SearchPalette';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import SiteHeader from '@/components/SiteHeader/SiteHeader';

import styles from './styles.module.css';

export interface LayoutProps extends ComponentProps<'div'> {}

const Layout = ({ className, ...props }: LayoutProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<a className={styles.skipLink} href="#main">
				Skip to the content
			</a>
			<SiteHeader />
			<main className={styles.main} id="main">
				<Outlet />
			</main>
			<SiteFooter />
			<BackToTop />
			<SearchPalette />
		</div>
	);
};

export default Layout;
