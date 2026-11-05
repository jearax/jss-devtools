import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import ScrollProgress from './ScrollProgress';

const addSpacer = (height: number) => {
	const spacer = document.createElement('div');

	spacer.dataset.spacer = '';
	spacer.style.height = `${height}px`;
	document.body.append(spacer);
};

const progressOf = (bar: HTMLElement) => {
	return Number(bar.style.getPropertyValue('--scroll-progress'));
};

const renderBar = async () => {
	// Inside a sticky header, as in SiteHeader: below the content its -1px offset would add a
	// pixel to the page.
	const screen = await render(
		<header
			style={{
				position: 'sticky',
				top: 0
			}}
		>
			<ScrollProgress />
		</header>
	);

	return screen.container.querySelector<HTMLElement>('[data-scrollable]')!;
};

describe('ScrollProgress', () => {
	afterEach(() => {
		document.querySelectorAll('[data-spacer]').forEach((spacer) => {
			spacer.remove();
		});
		window.scrollTo({
			top: 0,
			behavior: 'instant'
		});
	});

	it('stays hidden while the page does not scroll', async () => {
		const bar = await renderBar();

		await expect.element(bar).toHaveAttribute('data-scrollable', 'false');
		expect(progressOf(bar)).toBe(0);
	});

	it('follows the scroll position from top to bottom', async () => {
		const bar = await renderBar();

		addSpacer(4000);

		await expect.element(bar).toHaveAttribute('data-scrollable', 'true');

		const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight;

		window.scrollTo({
			top: scrollable / 2,
			behavior: 'instant'
		});
		await expect
			.poll(() => {
				return progressOf(bar);
			})
			.toBeCloseTo(0.5, 2);

		window.scrollTo({
			top: scrollable,
			behavior: 'instant'
		});
		await expect
			.poll(() => {
				return progressOf(bar);
			})
			.toBe(1);
	});

	it('appears when the page grows without a scroll', async () => {
		const bar = await renderBar();

		await expect.element(bar).toHaveAttribute('data-scrollable', 'false');

		addSpacer(4000);

		await expect.element(bar).toHaveAttribute('data-scrollable', 'true');
	});
});
