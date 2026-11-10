import { ThemeProvider } from '@jjuidev/react';
import { detectPlatform } from '@tanstack/react-hotkeys';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { SEARCH_OPEN_EVENT } from '@/constants/search.constant';

import SearchPalette from './SearchPalette';

/** The trigger the header holds, and the one the palette falls back to. */
const Trigger = () => {
	return (
		<button
			type="button"
			data-search-trigger="desktop"
			onClick={() => {
				window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
			}}
		>
			Open the search
		</button>
	);
};

const renderPalette = async () => {
	const router = createMemoryRouter(
		[
			{
				path: '/',
				element: (
					<>
						<Trigger />
						<SearchPalette />
					</>
				)
			},
			{
				path: '/docs/install',
				element: <p>Install page</p>
			}
		],
		{ initialEntries: ['/'] }
	);

	return render(
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>
	);
};

describe('SearchPalette', () => {
	it('opens when the trigger asks for it', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('opens on the keyboard shortcut', async () => {
		const screen = await renderPalette();

		const modifier = detectPlatform() === 'mac' ? 'Meta' : 'Control';

		await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`);

		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('is a modal dialog with a combobox in it', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await expect.element(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
	});

	it('shows the docs pages before anything is typed', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await expect.element(screen.getByRole('option', { name: /^Install/ })).toBeInTheDocument();
		await expect.element(screen.getByRole('option', { name: /^Getting started/ })).toBeInTheDocument();
	});

	it('filters the pages and the sections', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await screen.getByRole('combobox').fill('options');

		await expect.element(screen.getByRole('option', { name: /^The init options/ })).toBeInTheDocument();
	});

	it('marks the highlighted option as the selected one', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await expect
			.element(screen.getByRole('option', { name: /^Getting started/ }))
			.toHaveAttribute('aria-selected', 'true');
	});

	it('announces how many results there are', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		// The count sits in a live region, so a screen reader hears it when it changes.
		const count = screen.getByText(/^\d+ results$/);

		await expect.element(count).toBeInTheDocument();
		await expect.element(count).toHaveAttribute('role', 'status');
	});

	it('takes the reader to the page they chose', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await screen.getByRole('option', { name: /^Install/ }).click();

		await expect.element(screen.getByText('Install page')).toBeInTheDocument();
	});

	it('closes on Escape and gives the focus back to the trigger', async () => {
		const screen = await renderPalette();
		const trigger = screen.getByRole('button', { name: 'Open the search' });

		await trigger.click();

		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

		await userEvent.keyboard('{Escape}');

		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();

		// The focus goes back to the trigger that opened the palette.
		await expect
			.poll(() => {
				return document.activeElement?.getAttribute('data-search-trigger');
			})
			.toBe('desktop');
	});

	it('offers a way in when nothing matched', async () => {
		const screen = await renderPalette();

		await screen.getByRole('button', { name: 'Open the search' }).click();

		await screen.getByRole('combobox').fill('nothing matches this');

		await expect
			.element(screen.getByRole('link', { name: 'Read the getting started guide' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});
});
