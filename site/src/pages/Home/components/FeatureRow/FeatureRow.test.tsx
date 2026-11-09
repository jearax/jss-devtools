import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { COMMANDS } from '@/constants/commands.constant';

import FeatureRow from './FeatureRow';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('FeatureRow', () => {
	it('shows the three commands and what each one does', async () => {
		const screen = await render(<FeatureRow />, { wrapper });

		for (const command of COMMANDS) {
			// The card renders the summary through RichText, so the code between backticks is markup.
			const summary = command.summary.replaceAll('`', '');

			await expect.element(screen.getByRole('heading', { name: command.name })).toBeInTheDocument();
			await expect.element(screen.getByText(summary)).toBeInTheDocument();
		}
	});

	it('links every card to the docs page of its command, with no second link inside', async () => {
		const screen = await render(<FeatureRow />, { wrapper });

		for (const slug of ['init', 'doctor', 'harness']) {
			await expect
				.element(screen.getByRole('link', { name: `Read the ${slug} docs` }))
				.toHaveAttribute('href', `/docs/${slug}`);
		}

		// One interactive surface per card: three links on the page, one per card.
		expect(screen.container.querySelectorAll('a').length).toBe(3);
	});
});
