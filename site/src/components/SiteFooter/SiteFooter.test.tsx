import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { LICENSE, SOURCE_LABEL, SOURCE_URL } from '@/constants/cli.constant';
import { DOCS_PAGES } from '@/constants/routes.constant';

import { FOOTER_COLUMNS } from './footer.constant';
import SiteFooter from './SiteFooter';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('SiteFooter', () => {
	it('shows the grouped link columns, with headings', async () => {
		const screen = await render(<SiteFooter />, { wrapper });

		// The heading text can repeat a link's label ('Reference'), so the column is found by its name.
		for (const column of FOOTER_COLUMNS) {
			await expect.element(screen.getByRole('navigation', { name: column.heading })).toBeInTheDocument();
		}
	});

	it('links every docs page once, at its route', async () => {
		const screen = await render(<SiteFooter />, { wrapper });

		const docsLinks = FOOTER_COLUMNS.flatMap((column) => {
			return column.links.filter((link) => {
				return !link.external;
			});
		});

		expect(docsLinks.length).toBe(DOCS_PAGES.length);

		for (const link of docsLinks) {
			await expect.element(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
		}
	});

	it('links the source repository, and shows the license', async () => {
		const screen = await render(<SiteFooter />, { wrapper });

		await expect.element(screen.getByRole('link', { name: SOURCE_LABEL })).toHaveAttribute('href', SOURCE_URL);
		await expect.element(screen.getByText(`${LICENSE} licensed`)).toBeInTheDocument();
	});
});
