import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { SEARCH_TRIGGER_LABEL } from '@/constants/search.constant';

import Layout from './Layout';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('Layout', () => {
	it('offers a skip link to the content', async () => {
		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		await expect.element(screen.getByRole('link', { name: 'Skip to the content' })).toHaveAttribute('href', '#main');
	});

	it('puts the page inside the main landmark', async () => {
		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		await expect.element(screen.getByRole('main')).toContainElement(screen.getByText('The page'));
	});

	it('opens the search palette from the header trigger', async () => {
		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		// The bar's own trigger is the only one now the panel is gone.
		await screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL }).click();

		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
