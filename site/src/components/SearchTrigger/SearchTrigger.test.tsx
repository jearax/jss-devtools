import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SEARCH_OPEN_EVENT, SEARCH_TRIGGER_LABEL } from '@/constants/search.constant';

import SearchTrigger from './SearchTrigger';

describe('SearchTrigger', () => {
	it('announces what it does', async () => {
		const screen = await render(<SearchTrigger />, { wrapper: ThemeProvider });

		await expect.element(screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL })).toBeInTheDocument();
	});

	it('shows the keyboard hint', async () => {
		const screen = await render(<SearchTrigger />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('⌘K')).toBeInTheDocument();
	});

	it('asks the palette to open when it is pressed', async () => {
		const opened = vi.fn();

		window.addEventListener(SEARCH_OPEN_EVENT, opened);

		const screen = await render(<SearchTrigger />, { wrapper: ThemeProvider });

		await screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL }).click();

		expect(opened).toHaveBeenCalledTimes(1);

		window.removeEventListener(SEARCH_OPEN_EVENT, opened);
	});

	it('says where it sits, so the palette can fall back to it', async () => {
		const screen = await render(<SearchTrigger />, { wrapper: ThemeProvider });

		await expect
			.element(screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL }))
			.toHaveAttribute('data-search-trigger', 'desktop');
	});
});
