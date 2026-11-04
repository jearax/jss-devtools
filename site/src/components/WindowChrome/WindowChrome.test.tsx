import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import WindowChrome from './WindowChrome';

describe('WindowChrome', () => {
	it('carries the three status dots and the title', async () => {
		const screen = await render(<WindowChrome title="install.sh" />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('install.sh')).toBeInTheDocument();
		expect(screen.container.querySelectorAll('[data-tone]').length).toBe(3);
	});

	it('holds the right-hand side, such as an action', async () => {
		const screen = await render(
			<WindowChrome title="a.json">
				<span>Example output</span>
			</WindowChrome>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('Example output')).toBeInTheDocument();
	});
});
