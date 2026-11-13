import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';

const TEMPLATES_DIR = new URL('../templates/', import.meta.url);
const BUILD_OUTPUTS = ['node_modules', 'dist'];

const templateNames = () => {
	return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
		.filter((entry) => {
			return entry.isDirectory();
		})
		.map((entry) => {
			return entry.name;
		});
};

const templateDir = (name) => {
	const names = templateNames();

	if (!name || !names.includes(name)) {
		throw new Error(`Name a template: ${names.join(', ')}`);
	}

	return new URL(`${name}/`, TEMPLATES_DIR);
};

// The template is not a workspace package: --ignore-workspace keeps the root lockfile untouched, no
// lockfile is written beside the template, and --ignore-scripts skips its `prepare: husky`, whose
// husky only arrives with the toolchain init merges in.
const installOne = (name) => {
	execFileSync('pnpm', ['install', '--ignore-workspace', '--ignore-scripts', '--config.lockfile=false'], {
		cwd: templateDir(name),
		stdio: 'inherit'
	});
};

const install = (name) => {
	for (const each of name ? [name] : templateNames()) {
		installOne(each);
	}
};

const clean = (name) => {
	const dir = templateDir(name);

	for (const output of BUILD_OUTPUTS) {
		const target = new URL(output, dir);

		if (existsSync(target)) {
			rmSync(target, {
				recursive: true,
				force: true
			});
		}
	}
};

// Runs from the root `prepare`, which pnpm skips when an install changes nothing, so a fresh clone or
// a dependency change installs every template; `pnpm template:install` reinstalls on demand. CI
// (CI=true) never needs them: the bundle embeds template files only, and nothing in production installs.
const installAll = () => {
	if (process.env.CI) {
		return;
	}

	install();
};

const COMMANDS = {
	install,
	clean,
	'install-all': installAll
};

const [command, name] = process.argv.slice(2);
const run = COMMANDS[command];

if (!run) {
	throw new Error('Usage: node scripts/template-deps.mjs <install [template]|clean <template>|install-all>');
}

run(name);
