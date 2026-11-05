import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import Pager from './Pager';

const renderAt = (path: string) => {
	const wrapper = ({ children }: { children: ReactNode }) => {
		return (
			<ThemeProvider>
				<MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
			</ThemeProvider>
		);
	};

	return render(<Pager />, { wrapper });
};

describe('Pager', () => {
	it('shows the two neighbouring pages leaning apart, named direction then title', async () => {
		const screen = await renderAt('/docs/doctor');

		await expect.element(screen.getByRole('link', { name: 'Previous init' })).toHaveAttribute('href', '/docs/init');
		await expect.element(screen.getByRole('link', { name: 'Next harness' })).toHaveAttribute('href', '/docs/harness');
	});

	it('hides the arrows from the accessibility tree, so names stay direction then title', async () => {
		const screen = await renderAt('/docs/doctor');

		// Both lucide arrows are rendered as art inside the direction labels.
		expect(screen.container.querySelectorAll('svg[aria-hidden="true"]').length).toBe(2);

		// The accessible name is exactly the label plus the title; the icons add nothing.
		await expect.element(screen.getByRole('link', { name: 'Previous init' })).toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: 'Next harness' })).toBeInTheDocument();
	});
});
