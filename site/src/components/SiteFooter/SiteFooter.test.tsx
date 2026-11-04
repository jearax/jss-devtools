import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { LICENSE, SOURCE_LABEL, SOURCE_URL } from '@/constants/cli.constant';

import SiteFooter from './SiteFooter';

describe('SiteFooter', () => {
	it('links to the source repository', async () => {
		const screen = await render(<SiteFooter />, { wrapper: ThemeProvider });

		await expect.element(screen.getByRole('link', { name: SOURCE_LABEL })).toHaveAttribute('href', SOURCE_URL);
	});

	it('shows the license', async () => {
		const screen = await render(<SiteFooter />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText(`${LICENSE} licensed`)).toBeInTheDocument();
	});
});
