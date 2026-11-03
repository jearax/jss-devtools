import { PACKAGE } from '@/core/constants/package.constant';
import { shellQuote } from '@/core/utils/shell-quote.util';

type CommandLike = {
	parent?: CommandLike | null | undefined;
	rawArgs?: readonly string[] | undefined;
};

export const applyCommandLineOf = (command: CommandLike): string => {
	let root: CommandLike = command;

	while (root.parent !== undefined && root.parent !== null) {
		root = root.parent;
	}

	const rawArgs = root.rawArgs ?? [];

	const words = rawArgs.slice(2).filter((word) => {
		return word !== '--dry-run';
	});

	return [PACKAGE.name, ...words].map(shellQuote).join(' ');
};
