import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { INSTALL_COMMAND, INSTALL_PLATFORM_LABEL } from '@/constants/cli.constant';

import InstallBlock from './InstallBlock';

describe('InstallBlock', () => {
	it('shows the command, the copy control and the platform line', async () => {
		const screen = await render(<InstallBlock />);

		await expect.element(screen.getByText(INSTALL_COMMAND)).toBeInTheDocument();
		await expect.element(screen.getByText(INSTALL_PLATFORM_LABEL)).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Copy the install command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(INSTALL_COMMAND);
	});
});
