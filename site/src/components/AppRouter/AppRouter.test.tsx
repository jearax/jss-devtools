import { ThemeProvider } from '@jjuidev/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { createRoutes } from './AppRouter';

const renderAt = (path: string) => {
	const router = createMemoryRouter(createRoutes(), { initialEntries: [path] });

	return render(
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>
	);
};

describe('the router', () => {
	it('renders the home page at the root', async () => {
		const screen = await renderAt('/');

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();
	});

	it('renders the not-found view for a path it does not know', async () => {
		const screen = await renderAt('/there-is-no-such-page');

		await expect
			.element(screen.getByRole('heading', { name: 'This page is not part of the site.' }))
			.toBeInTheDocument();
	});
});
