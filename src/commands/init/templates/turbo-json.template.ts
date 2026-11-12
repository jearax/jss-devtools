export const turboJsonTemplate = (): string => {
	const turboJson = {
		$schema: 'https://turborepo.dev/schema.json',
		tasks: {
			build: {
				dependsOn: ['^build'],
				outputs: ['dist/**']
			},
			typecheck: {
				dependsOn: ['^build']
			},
			lint: {
				dependsOn: ['^build']
			},
			dev: {
				cache: false,
				persistent: true
			},
			'//#lint:root': {}
		}
	};

	return `${JSON.stringify(turboJson, null, '\t')}\n`;
};
