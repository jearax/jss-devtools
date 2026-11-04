import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { LICENSE, NODE_FLOOR, PLATFORM_SCOPE } from '@/constants/cli.constant';

import BadgeStrip from './BadgeStrip';

describe('BadgeStrip', () => {
	it('names the license, the Node floor and the platform', async () => {
		const screen = await render(<BadgeStrip />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('License')).toBeInTheDocument();
		await expect.element(screen.getByText(LICENSE)).toBeInTheDocument();
		await expect.element(screen.getByText(`Node ${NODE_FLOOR}`)).toBeInTheDocument();
		await expect.element(screen.getByText(PLATFORM_SCOPE)).toBeInTheDocument();
	});
});
