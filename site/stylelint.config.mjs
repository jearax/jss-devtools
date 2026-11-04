const tailwindAtRules = [
	'theme',
	'source',
	'utility',
	'variant',
	'custom-variant',
	'apply',
	'reference',
	'plugin',
	'config'
];

const stylelintConfig = {
	extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
	ignoreFiles: ['dist/**', 'coverage/**', 'node_modules/**'],
	rules: {
		'at-rule-no-unknown': [true, { ignoreAtRules: tailwindAtRules }],
		'at-rule-prelude-no-invalid': [true, { ignoreAtRules: tailwindAtRules }],
		'at-rule-empty-line-before': [
			'always',
			{
				except: ['blockless-after-same-name-blockless', 'first-nested'],
				ignore: ['after-comment'],
				ignoreAtRules: ['import', ...tailwindAtRules]
			}
		],
		'import-notation': 'string',
		'function-no-unknown': [true, { ignoreFunctions: ['theme', '--spacing', '--alpha'] }],
		'declaration-property-value-no-unknown': null,
		'custom-property-no-missing-var-function': null
	},
	overrides: [
		{
			files: ['src/styles/*.css'],
			rules: {
				'custom-property-pattern': null,
				'custom-property-empty-line-before': null,
				'comment-empty-line-before': null,
				'alpha-value-notation': null,
				'value-keyword-case': null,
				'no-invalid-position-declaration': null
			}
		},
		{
			files: ['**/*.module.css'],
			rules: {
				'selector-class-pattern': [
					'^[a-z][a-zA-Z0-9]*$',
					{ message: (selector) => `Expected class selector "${selector}" to be camelCase` }
				]
			}
		}
	]
};

export default stylelintConfig;
