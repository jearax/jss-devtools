import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { JSS_DEVTOOLS_SKIN } from './jss-devtools.skin';

const wrapper = ({ children }: { children: ReactNode }) => {
	return <ThemeProvider skins={[JSS_DEVTOOLS_SKIN]}>{children}</ThemeProvider>;
};

describe('the site skin', () => {
	it('is the skin the provider applies', async () => {
		document.cookie = `jds-skin=${JSS_DEVTOOLS_SKIN.id}`;

		await render(<div />, { wrapper });

		await expect
			.poll(() => {
				return document.documentElement.dataset.skin;
			})
			.toBe(JSS_DEVTOOLS_SKIN.id);
	});

	it('paints the page with the skin values, not the platform ones', async () => {
		document.cookie = `jds-skin=${JSS_DEVTOOLS_SKIN.id}`;

		await render(<div />, { wrapper });

		await expect
			.poll(() => {
				return getComputedStyle(document.documentElement).getPropertyValue('--color-primary-700').trim();
			})
			.toBe('#005b60');
	});

	it('is named the same in the document shell', async () => {
		const shell = await fetch('/index.html').then((response) => {
			return response.text();
		});

		expect(shell).toContain(`jds-skin=${JSS_DEVTOOLS_SKIN.id}`);
	});

	it('is not shared with the other hosts on the domain', async () => {
		const shell = await fetch('/index.html').then((response) => {
			return response.text();
		});

		// A Domain attribute would make this site's default skin a preference every host on the domain reads.
		expect(shell).not.toContain('Domain=');
	});
});
