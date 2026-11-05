import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import BackToTop from './BackToTop';

const wrapper = ({ children }: { children: ReactNode }) => {
	return <ThemeProvider>{children}</ThemeProvider>;
};

const TALL_PAGE = (
	<>
		<BackToTop />
		<div style={{ height: '3000px' }} />
	</>
);

describe('BackToTop', () => {
	it('stays out of the tree at the top of the page', async () => {
		await page.viewport(1280, 720);

		const screen = await render(TALL_PAGE, { wrapper });

		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('appears once the page has scrolled past a viewport', async () => {
		await page.viewport(1280, 720);

		const screen = await render(TALL_PAGE, { wrapper });

		window.scrollTo(0, 900);

		await expect.element(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();
	});

	it('hides near the page bottom, where the footer fine print sits', async () => {
		await page.viewport(1280, 720);

		const screen = await render(TALL_PAGE, { wrapper });

		window.scrollTo(0, 900);
		await expect.element(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();

		window.scrollTo(0, 999999);
		await vi.waitFor(() => {
			expect(screen.container.querySelector('button')).toBeNull();
		});
	});

	it('returns to the top when pressed', async () => {
		await page.viewport(1280, 720);

		const screen = await render(TALL_PAGE, { wrapper });

		window.scrollTo(0, 900);
		await expect.element(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();

		await screen.getByRole('button', { name: 'Back to top' }).click();

		await vi.waitFor(() => {
			expect(window.scrollY).toBe(0);
		});
	});
});
