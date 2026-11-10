import { ThemeProvider } from '@jjuidev/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { DOCS_PAGES, docsHref } from '@/constants/routes.constant';

import { createDocsRoute } from './Docs.route';

const renderAt = (path: string) => {
	const router = createMemoryRouter(
		[
			{
				path: '/docs',
				...createDocsRoute()
			}
		],
		{ initialEntries: [path] }
	);

	return render(
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>
	);
};

describe('the docs area', () => {
	it('opens the first page from the docs index', async () => {
		const screen = await renderAt('/docs');

		await expect
			.element(
				screen.getByRole('heading', {
					name: 'Getting started',
					level: 1
				})
			)
			.toBeInTheDocument();
	});

	it('renders every page at its own path', async () => {
		for (const page of DOCS_PAGES) {
			const screen = await renderAt(docsHref(page.slug));

			await expect
				.element(
					screen.getByRole('heading', {
						name: page.title,
						level: 1
					})
				)
				.toBeInTheDocument();
		}
	});

	it('marks the current page in the sidebar', async () => {
		const screen = await renderAt('/docs/install');

		// The disclosure may start folded at a narrow viewport; opening it reveals the links.
		try {
			const disclosure = page.getByRole('button', { name: 'Docs' });

			await disclosure.click();
		} catch {
			// The wide nav shows its links outright; there is no disclosure to open.
		}

		await expect.element(screen.getByRole('link', { name: 'Install' })).toHaveAttribute('aria-current', 'page');
	});

	it('groups the command pages under a header that is not a link', async () => {
		const screen = await renderAt('/docs/install');

		const sidebar = screen.getByRole('navigation', { name: 'The docs pages' });

		// The group names its children; it never navigates and never enters the pager or the index.
		await expect.element(sidebar.getByText('Commands')).toBeInTheDocument();
		expect(screen.container.querySelector('a[href="/docs/Commands"]')).toBeNull();
	});

	it('shows the group in the breadcrumbs of a child page', async () => {
		const screen = await renderAt('/docs/init');

		const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });

		await expect.element(crumbs.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
		await expect.element(crumbs.getByText('Commands')).toBeInTheDocument();
		await expect.element(crumbs.getByText('init')).toHaveAttribute('aria-current', 'page');
	});

	it('offers the neighbouring pages', async () => {
		const screen = await renderAt('/docs/install');

		await expect
			.element(screen.getByRole('link', { name: /Previous/ }))
			.toHaveAttribute('href', '/docs/getting-started');
		await expect.element(screen.getByRole('link', { name: /Next/ })).toHaveAttribute('href', '/docs/init');
	});

	it('offers a table of contents for a page with sections', async () => {
		// The table of contents is a rail beside the content, so it is only there on a wide viewport.
		await page.viewport(1280, 720);

		const screen = await renderAt('/docs/reference');

		await expect
			.element(screen.getByRole('link', { name: 'The init options' }))
			.toHaveAttribute('href', '#the-options');
	});

	it('states the install command on the install page', async () => {
		const screen = await renderAt('/docs/install');

		await expect.element(screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/)).toBeInTheDocument();
	});

	it('states the exit codes on the reference page', async () => {
		const screen = await renderAt('/docs/reference');

		await expect.element(screen.getByText(/The command succeeded\./)).toBeInTheDocument();
		await expect.element(screen.getByText(/The command failed\./)).toBeInTheDocument();
	});
});
