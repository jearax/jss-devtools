import { readFileSync } from 'node:fs';

import { runHook } from './dispatcher.service';
import { logHookError } from './hook-errors.service';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

try {
	const raw = readFileSync(0, 'utf8');
	const result = await runHook(root, raw, process.argv[2] ?? '');

	if (result !== null) {
		process.stdout.write(`${JSON.stringify(result)}\n`);
	}
} catch (error) {
	logHookError(root, error instanceof Error ? error.message : String(error));
}

process.exitCode = 0;
