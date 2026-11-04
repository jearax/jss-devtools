import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { COMMANDS } from '@/constants/commands.constant';

import FeatureRow from './FeatureRow';

describe('FeatureRow', () => {
	it('shows the three commands and what each one does', async () => {
		const screen = await render(<FeatureRow />, { wrapper: ThemeProvider });

		for (const command of COMMANDS) {
			await expect.element(screen.getByRole('heading', { name: command.name })).toBeInTheDocument();
			await expect.element(screen.getByText(command.summary)).toBeInTheDocument();
		}
	});

	it('links every card to the docs page of its command', async () => {
		const screen = await render(<FeatureRow />, { wrapper: ThemeProvider });

		await expect
			.element(screen.getByRole('link', { name: 'Read the init docs' }))
			.toHaveAttribute('href', '/docs/init');
		await expect
			.element(screen.getByRole('link', { name: 'Read the doctor docs' }))
			.toHaveAttribute('href', '/docs/doctor');
		await expect
			.element(screen.getByRole('link', { name: 'Read the harness docs' }))
			.toHaveAttribute('href', '/docs/harness');
	});
});
