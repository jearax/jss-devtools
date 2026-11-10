export type CommandWord = {
	text: string;
	program: boolean;
};

// zsh-syntax-highlighting colours the program that starts each pipeline stage, nothing else.
export const highlightCommand = (command: string): CommandWord[] => {
	let expectProgram = true;

	return command.split(/(\s+)/).map((text) => {
		if (text.trim() === '') {
			return {
				text,
				program: false
			};
		}

		const program = expectProgram && text !== '|';

		expectProgram = text === '|';

		return {
			text,
			program
		};
	});
};
