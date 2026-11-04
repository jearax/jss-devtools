import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { SEARCH_TRIGGER_LABEL } from '@/constants/search.constant';
import { THEME_TOGGLE_LABEL } from '@/constants/theme.constant';

import SiteHeader from './SiteHeader';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('SiteHeader', () => {
	it('offers the navigation and marks the current route', async () => {
		// The navigation and the install link are only there on a wide viewport.
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		// The narrow layout carries the same links in its panel, so the desktop nav is scoped.
		const nav = screen.getByRole('navigation', { name: 'Main' });

		await expect.element(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
		await expect.element(nav.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
	});

	it('offers a way into the install guide', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		await expect.element(screen.getByRole('link', { name: 'Install' })).toHaveAttribute('href', '/docs/install');
	});

	it('offers a theme toggle', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		await expect.element(screen.getByRole('button', { name: THEME_TOGGLE_LABEL })).toBeInTheDocument();
	});

	it('shows the brand mark with its wordmark', async () => {
		// Above md, so the mark's own media query does not collapse the wordmark.
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		const banner = screen.getByRole('banner');

		await expect.element(banner.getByText('jjui', { exact: true })).toBeVisible();
		await expect.element(banner.getByText('dev', { exact: true })).toBeVisible();
	});

	it('keeps the closed menu out of the accessibility tree', async () => {
		await page.viewport(360, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		await expect
			.element(screen.getByRole('button', { name: 'Open the menu' }))
			.toHaveAttribute('aria-expanded', 'false');
	});

	it('offers the search trigger on a wide viewport', async () => {
		await page.viewport(1440, 900);

		const screen = await render(<SiteHeader />, { wrapper });

		/*
		 * The header carries the trigger twice: once in the desktop bar and once in the narrow
		 * panel. Both live in the DOM at every width, so the desktop one is picked by position.
		 */
		const trigger = screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL }).first();

		await expect.element(trigger).toBeVisible();
	});

	it('offers the search trigger inside the mobile panel', async () => {
		await page.viewport(390, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		await screen.getByRole('button', { name: 'Open the menu' }).click();

		const panel = document.getElementById('site-menu');

		expect(panel?.getAttribute('data-open')).toBe('true');
		expect(panel?.querySelector(`button[aria-label="${SEARCH_TRIGGER_LABEL}"]`)).not.toBeNull();
	});

	it.each([1440, 390])('raises its surface once the page has scrolled past the top at %ipx', async (width) => {
		await page.viewport(width, 720);

		/*
		 * The page needs to be taller than the viewport, otherwise there is nothing to scroll and
		 * the sentinel can never leave the screen.
		 */
		const screen = await render(
			<>
				<SiteHeader />
				<div style={{ height: '2000px' }} />
			</>,
			{ wrapper }
		);

		const banner = screen.getByRole('banner');

		await expect.element(banner).not.toHaveAttribute('data-scrolled', 'true');

		// The sentinel is the first thing on the page, so scrolling it out of view is the crossing.
		window.scrollTo(0, 200);

		await expect.element(banner).toHaveAttribute('data-scrolled', 'true');
	});
});
