import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'tsdown';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Reuse the two shipped configs so the build under test is the build the repo ships.
const buildOnce = async (): Promise<void> => {
	await build({
		cwd: projectRoot,
		config: resolve(projectRoot, 'tsdown.hooks.config.ts')
	});
	await build({
		cwd: projectRoot,
		config: resolve(projectRoot, 'tsdown.config.ts')
	});
};

export default buildOnce;
