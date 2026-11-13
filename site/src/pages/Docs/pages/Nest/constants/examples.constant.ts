/** One response the page shows: what was asked, the curl line, and the real answer. */
export type NestResponseExample = {
	title: string;
	curl: string;
	output: string;
	note?: string;
};

/**
 * The response envelope examples, copied verbatim from a real run of the built app
 * (`node dist/main.js` after `nest build`).
 */
export const NEST_RESPONSES: readonly NestResponseExample[] = [
	{
		title: 'The health route answers 200',
		curl: "curl -s 'http://localhost:3000/health/ready'",
		output: '{"status":200,"message":"Success.","data":{"status":"ok","info":{},"error":{},"details":{}}}'
	},
	{
		title: 'A malformed body answers 400',
		curl: "curl -s 'http://localhost:3000/_nowhere?lang=vi' -X POST -H 'Content-Type: application/json' --data '{\"name\":'",
		output: '{"status":400,"message":"The request is invalid.","data":null}',
		note: 'Express parses the body before the i18n middleware runs, so a malformed body answers in the default locale even with `?lang=vi`.'
	},
	{
		title: 'An unknown route answers 404 in the requested language',
		curl: "curl -s 'http://localhost:3000/_nowhere?lang=en'",
		output: '{"status":404,"message":"The resource was not found.","data":null}'
	}
];

/** The curl lines of the language section, shown as one copyable block. */
export const NEST_LANGUAGE_CURLS = [
	"curl -s 'http://localhost:3000/_nowhere?lang=vi'",
	"curl -s 'http://localhost:3000/_nowhere' -H 'x-lang: vi'",
	"curl -s 'http://localhost:3000/_nowhere' -H 'Accept-Language: vi'"
].join('\n');
