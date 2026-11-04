import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { NODE_FLOOR, SOURCE_URL } from '@/constants/cli.constant';
import { VALUE_LINE } from '@/pages/Home/Home.constant';

import Home from './Home';

const renderHome = async () => {
	return render(<Home />, { wrapper: ThemeProvider });
};

describe('Home', () => {
	it('shows the product name and the headline', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();
		const names = screen.getByText('jss-devtools').all();

		expect(names.length).toBeGreaterThan(0);
	});

	it('shows the value line', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText(VALUE_LINE)).toBeInTheDocument();
	});

	it('shows the install command in the hero, the install band and the closing band', async () => {
		const screen = await renderHome();

		const commands = screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/).all();

		expect(commands.length).toBe(3);
	});

	it('shows the Node floor', async () => {
		const screen = await renderHome();

		const floors = screen.getByText(new RegExp(`Node ${NODE_FLOOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)).all();

		expect(floors.length).toBeGreaterThan(0);
	});

	it('shows the three commands with the command each one runs', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByRole('heading', { name: 'init' })).toBeInTheDocument();
		await expect.element(screen.getByText('jss-devtools init my-app --pm pnpm --dry-run')).toBeInTheDocument();
		await expect.element(screen.getByRole('heading', { name: 'doctor' })).toBeInTheDocument();
		await expect.element(screen.getByRole('heading', { name: 'harness' })).toBeInTheDocument();

		// Once in the command card, once as the hero's typed command.
		const harness = screen.getByText('jss-devtools harness doctor').all();

		expect(harness.length).toBe(2);
	});

	it('shows what the doctor prints', async () => {
		const screen = await renderHome();

		// Once in the command card, once in the hero's terminal.
		const outputs = screen.getByText('└  Ready: Node.js, git and 4 package managers').all();

		expect(outputs.length).toBe(2);
	});

	it('shows the terminal transcript, labelled as an example', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText('Example output')).toBeInTheDocument();

		// Once in the hero's terminal, once in the command card's terminal.
		const transcripts = screen.getByText(/^┌ {3}jss-devtools doctor/).all();

		expect(transcripts.length).toBe(2);
	});

	it('offers a way into the docs from the hero and the closing band', async () => {
		const screen = await renderHome();

		const started = screen.getByRole('link', { name: 'Get started' }).all();

		expect(started.length).toBe(2);

		for (const link of started) {
			await expect.element(link).toHaveAttribute('href', '/docs/getting-started');
		}
	});

	it('shows the harness hooks and the skills', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText('SessionStart')).toBeInTheDocument();
		await expect.element(screen.getByText('PostToolUseFailure')).toBeInTheDocument();
		await expect.element(screen.getByText('harness-onboard')).toBeInTheDocument();
		await expect.element(screen.getByText('harness-curate')).toBeInTheDocument();
	});

	it('shows the init options and the exit codes', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText('--framework <name>')).toBeInTheDocument();
		await expect.element(screen.getByText('--agent-kit')).toBeInTheDocument();
		await expect.element(screen.getByText('--dry-run')).toBeInTheDocument();
		await expect.element(screen.getByText(/The command succeeded\./)).toBeInTheDocument();
		await expect.element(screen.getByText(/The command failed\./)).toBeInTheDocument();
	});

	it('lists the requirements', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText(`Node ${NODE_FLOOR}`)).toBeInTheDocument();
		await expect.element(screen.getByText('curl or wget')).toBeInTheDocument();
		await expect.element(screen.getByText('sha256sum or shasum')).toBeInTheDocument();
		await expect.element(screen.getByText('~/.local/bin on PATH')).toBeInTheDocument();
	});

	it('links to the repository from the reference band', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByRole('link', { name: 'The repository' })).toHaveAttribute('href', SOURCE_URL);
	});
});
