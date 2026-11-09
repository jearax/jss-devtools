import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { PRODUCT_NAME, SOURCE_URL } from '@/constants/cli.constant';

import SiteFooter from './SiteFooter';

describe('SiteFooter', () => {
	it('names the product and links the docs and the repository', async () => {
		const screen = await render(
			<MemoryRouter>
				<SiteFooter />
			</MemoryRouter>
		);

		await expect.element(screen.getByText(PRODUCT_NAME)).toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/getting-started');
		await expect.element(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', SOURCE_URL);
		await expect.element(screen.getByText('MIT licence')).toBeInTheDocument();
	});
});
