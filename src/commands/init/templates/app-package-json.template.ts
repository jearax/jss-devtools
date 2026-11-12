export type AppPackageJsonTemplateInput = {
	appName: string;
};

export const appPackageJsonTemplate = ({ appName }: AppPackageJsonTemplateInput): string => {
	const manifest = {
		name: appName,
		version: '0.0.0',
		private: true,
		type: 'module',
		scripts: {
			dev: 'tsx watch src/main.ts',
			build: 'tsc && tsc-alias --resolve-full-paths',
			start: 'node dist/main.js',
			typecheck: 'tsc --noEmit',
			lint: 'eslint src'
		}
	};

	return `${JSON.stringify(manifest, null, '\t')}\n`;
};
