import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { SOURCE_URL } from '@/constants/cli.constant';
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
	it('carries no navigation links', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		expect(screen.container.querySelector('nav')).toBeNull();
		expect(screen.container.querySelector('a[href="/docs"]')).toBeNull();
	});

	it('links the source repository through its icon', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		const github = screen.getByRole('link', { name: 'View on GitHub' });

		await expect.element(github).toHaveAttribute('href', SOURCE_URL);
		await expect.element(github).toHaveAttribute('target', '_blank');
		await expect.element(github).toHaveAttribute('rel', 'noreferrer');
	});

	it('offers a theme toggle and the search trigger in the bar', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		await expect.element(screen.getByRole('button', { name: THEME_TOGGLE_LABEL })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL })).toBeInTheDocument();
	});

	it("offers the search trigger at a phone's width", async () => {
		await page.viewport(390, 720);

		const screen = await render(<SiteHeader />, { wrapper });

		/*
		 * The panel is gone, so the bar's own trigger is the only one: it must stay reachable at
		 * a phone's width, because it and the Getting started section are what route a reader to
		 * the docs now.
		 */
		await expect.element(screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL })).toBeVisible();
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
