import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import React from './React';
import { REACT_SECTIONS } from './React.constant';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('the react page', () => {
	it('renders every section heading', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<React />, { wrapper });

		for (const section of REACT_SECTIONS) {
			await expect
				.element(
					screen.getByRole('heading', {
						name: section.title,
						level: 2
					})
				)
				.toBeInTheDocument();
		}
	});

	it('shows the environment variable in a table', async () => {
		const screen = await render(<React />, { wrapper });

		await expect.element(screen.getByRole('cell', { name: 'VITE_FEATURE_SIDEBAR' })).toBeInTheDocument();
		await expect.element(screen.getByText('true')).toBeInTheDocument();
	});

	it('states the zustand and use conventions', async () => {
		const screen = await render(<React />, { wrapper });

		await expect.element(screen.getByText(/state lives beside its hook/)).toBeInTheDocument();
		await expect.element(screen.getByText(/use\(Context\) instead of useContext\(Context\)/)).toBeInTheDocument();
		await expect.element(screen.getByText(/gets its own small wrapper component/)).toBeInTheDocument();
	});
});
