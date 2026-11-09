import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import Breadcrumbs from './Breadcrumbs';

const renderAt = (path: string) => {
	const wrapper = ({ children }: { children: ReactNode }) => {
		return (
			<ThemeProvider>
				<MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
			</ThemeProvider>
		);
	};

	return render(<Breadcrumbs />, { wrapper });
};

describe('Breadcrumbs', () => {
	it('shows the group between Docs and a child page', async () => {
		const screen = await renderAt('/docs/init');

		const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

		await expect.element(crumbs.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
		await expect.element(crumbs.getByText('Commands')).toBeInTheDocument();
		await expect.element(crumbs.getByText('init')).toHaveAttribute('aria-current', 'page');
	});

	it('names a top-level page without a group', async () => {
		const screen = await renderAt('/docs/install');

		const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

		await expect.element(crumbs.getByText('Install')).toHaveAttribute('aria-current', 'page');

		// No group crumb: a top-level page would only repeat its title as a group.
		expect(screen.container.querySelector('nav[aria-label="Breadcrumb"]')?.textContent).toBe('Docs/Install');
	});
});
