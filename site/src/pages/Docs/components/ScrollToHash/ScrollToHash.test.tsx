import { ThemeProvider } from '@jjuidev/react';
import { useEffect, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import ScrollToHash from './ScrollToHash';

/** A page whose section arrives after the effect has run, the way a lazy route does it. */
const Late = () => {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsReady(true);
		}, 50);

		return () => {
			clearTimeout(timer);
		};
	}, []);

	return (
		<>
			<div style={{ height: '1500px' }} />
			{isReady ? <section id="the-section">The section</section> : null}
			<div style={{ height: '1500px' }} />
		</>
	);
};

const renderAt = async (hash: string) => {
	const router = createMemoryRouter(
		[
			{
				path: '/docs',
				element: (
					<>
						<ScrollToHash />
						<Late />
					</>
				)
			}
		],
		{ initialEntries: [`/docs${hash}`] }
	);

	return render(
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>
	);
};

describe('ScrollToHash', () => {
	beforeEach(() => {
		window.scrollTo(0, 0);
	});

	it('scrolls to the section once it is there', async () => {
		await renderAt('#the-section');

		await expect
			.poll(() => {
				return Math.round(document.getElementById('the-section')?.getBoundingClientRect().top ?? 999);
			})
			.toBe(0);
	});

	it('leaves the page alone when there is no hash', async () => {
		await renderAt('');

		await expect.element(document.body).toBeInTheDocument();

		expect(window.scrollY).toBe(0);
	});
});
