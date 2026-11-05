import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { LICENSE, SOURCE_LABEL, SOURCE_URL } from '@/constants/cli.constant';

import SiteFooter from './SiteFooter';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('SiteFooter', () => {
	it('shows one quiet line: the credit and the fine print', async () => {
		const screen = await render(<SiteFooter />, { wrapper });

		await expect.element(screen.getByText('Built by jjuidev')).toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: SOURCE_LABEL })).toHaveAttribute('href', SOURCE_URL);
		await expect.element(screen.getByText(`${LICENSE} licensed`)).toBeInTheDocument();
	});

	it('carries no navigation landmarks', async () => {
		const screen = await render(<SiteFooter />, { wrapper });

		expect(screen.container.querySelector('nav')).toBeNull();
	});
});
