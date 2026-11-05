import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import GettingStarted from './GettingStarted';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('GettingStarted', () => {
	it('offers a copy button for each first-run command', async () => {
		const screen = await render(<GettingStarted />, { wrapper });

		await expect.element(screen.getByRole('button', { name: 'Copy the install command' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Copy the doctor command' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Copy the init command' })).toBeInTheDocument();
	});

	it('copies the exact command', async () => {
		const screen = await render(<GettingStarted />, { wrapper });

		await screen.getByRole('button', { name: 'Copy the doctor command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe('jss-devtools doctor');
	});
});
