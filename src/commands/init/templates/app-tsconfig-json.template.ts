import { ALIAS_AND_OUTPUT } from './tsconfig-json.template';

export const appTsconfigJsonTemplate = (): string => {
	const tsconfig = {
		extends: '../../tsconfig.base.json',
		compilerOptions: ALIAS_AND_OUTPUT,
		include: ['src']
	};

	return `${JSON.stringify(tsconfig, null, '\t')}\n`;
};
