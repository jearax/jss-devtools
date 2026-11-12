import { baseCompilerOptions } from './tsconfig-json.template';

export const tsconfigBaseJsonTemplate = (): string => {
	const tsconfig = {
		compilerOptions: baseCompilerOptions()
	};

	return `${JSON.stringify(tsconfig, null, '\t')}\n`;
};
