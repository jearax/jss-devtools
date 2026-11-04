import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import DocPage from './DocPage';

/*
 * The sections are tall, so the page is taller than the viewport and the reader can scroll to
 * the section the test is about.
 */
const SECTIONS = [
	{
		id: 'first',
		title: 'First',
		body: <div style={{ height: '800px' }}>The first section.</div>
	},
	{
		id: 'second',
		title: 'Second',
		body: <div style={{ height: '800px' }}>The second section.</div>
	},
	{
		id: 'third',
		title: 'Third',
		body: <div style={{ height: '800px' }}>The third section.</div>
	}
];

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('DocPage', () => {
	it('lists the sections of the page once', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<DocPage title="A page" summary="A summary" sections={SECTIONS} />, { wrapper });

		await expect.element(screen.getByText('On this page')).toBeInTheDocument();

		await expect.element(screen.getByRole('link', { name: 'Second' })).toHaveAttribute('href', '#second');
	});

	it('marks the heading the reader is at', async () => {
		await page.viewport(1280, 720);

		const screen = await render(<DocPage title="A page" summary="A summary" sections={SECTIONS} />, { wrapper });

		document.getElementById('second')?.scrollIntoView({
			behavior: 'instant',
			block: 'start'
		});

		await expect.element(screen.getByRole('link', { name: 'Second' })).toHaveAttribute('data-active', 'true');
		await expect.element(screen.getByRole('link', { name: 'Second' })).toHaveAttribute('aria-current', 'location');
	});
});
