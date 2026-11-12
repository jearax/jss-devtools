// Written by scripts/pin-node-preset.mjs; rerun it instead of editing by hand.
export const NODE_PRESET_DEPENDENCIES = {
	'@commitlint/cli': '21.2.4',
	'@commitlint/config-conventional': '21.2.4',
	'@eslint/js': '10.0.1',
	'@types/node': '24.19.2',
	eslint: '10.14.0',
	'eslint-config-prettier': '10.1.8',
	'eslint-plugin-autofix': '2.2.0',
	'eslint-plugin-import-x': '4.18.1',
	'eslint-plugin-prefer-arrow-functions': '3.10.2',
	'eslint-plugin-prettier': '5.5.7',
	globals: '17.14.0',
	husky: '9.1.7',
	'lint-staged': '17.6.0',
	prettier: '3.10.0',
	'prettier-package-json': '2.8.0',
	'tsc-alias': '1.9.10',
	tsx: '4.23.15',
	typescript: '6.0.3',
	'typescript-eslint': '8.72.2'
} as const;

export const MONOREPO_PRESET_DEPENDENCIES = {
	turbo: '2.11.10'
} as const;
