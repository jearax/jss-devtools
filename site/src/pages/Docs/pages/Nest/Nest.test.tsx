import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import Nest from './Nest';
import { NEST_SECTIONS } from './Nest.constant';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('the nest page', () => {
	it('renders every section heading', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<Nest />, { wrapper });

		for (const section of NEST_SECTIONS) {
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

	it('shows the environment variables in a table', async () => {
		const screen = await render(<Nest />, { wrapper });

		await expect.element(screen.getByRole('cell', { name: 'APP_PORT' })).toBeInTheDocument();
		await expect.element(screen.getByText('3000')).toBeInTheDocument();
	});

	it('states the response envelope from a real run', async () => {
		const screen = await render(<Nest />, { wrapper });

		await expect.element(screen.getByText(/"status":200,"message":"Success\."/)).toBeInTheDocument();
		await expect.element(screen.getByText(/"status":400,"message":"The request is invalid\."/)).toBeInTheDocument();
		await expect.element(screen.getByText(/"status":404,"message":"The resource was not found\."/)).toBeInTheDocument();
	});
});
