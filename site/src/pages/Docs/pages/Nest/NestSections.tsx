import { Fragment, ReactNode } from 'react';

import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import { DocSection } from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { NEST_DOMAIN_PARAGRAPHS, NEST_DOMAIN_ROUTES } from '@/pages/Docs/pages/Nest/constants/domain.constant';
import { NEST_RESPONSES } from '@/pages/Docs/pages/Nest/constants/examples.constant';
import { NEST_ENV_PARAGRAPHS, NEST_ENV_ROWS, NEST_TREE, meta } from '@/pages/Docs/pages/Nest/Nest.constant';

const envDefaultCell = (value: string): ReactNode => {
	return value === '' ? <em>unset</em> : <code>{value}</code>;
};

export const whatItWritesSection: DocSection = {
	...meta('what-it-writes'),
	body: (
		<>
			<p>
				<code>jss-devtools init my-api --framework nest --pm pnpm -y</code> creates the project: the app below, the
				shared toolchain around it, and <code>pnpm install</code> with the chosen manager. The tree is the app&rsquo;s
				own <code>src/</code>; the specs beside them are left out here.
			</p>
			<CodeBlock code={NEST_TREE} title="the src/ tree" />
		</>
	)
};

export const exampleDomainSection: DocSection = {
	...meta('the-example-domain'),
	body: (
		<>
			{NEST_DOMAIN_PARAGRAPHS.map((paragraph) => {
				return (
					<p key={paragraph}>
						<RichText text={paragraph} />
					</p>
				);
			})}
			<table>
				<thead>
					<tr>
						<th scope="col">Method</th>
						<th scope="col">Path</th>
						<th scope="col">Success</th>
					</tr>
				</thead>
				<tbody>
					{NEST_DOMAIN_ROUTES.map((route) => {
						return (
							<tr key={`${route.method} ${route.path}`}>
								<td>
									<code>{route.method}</code>
								</td>
								<td>
									<code>{route.path}</code>
								</td>
								<td>
									<RichText text={route.success} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	)
};

export const environmentSection: DocSection = {
	...meta('the-environment'),
	body: (
		<>
			{NEST_ENV_PARAGRAPHS.map((paragraph) => {
				return (
					<p key={paragraph}>
						<RichText text={paragraph} />
					</p>
				);
			})}
			<table>
				<thead>
					<tr>
						<th scope="col">Variable</th>
						<th scope="col">Default</th>
						<th scope="col">What it does</th>
					</tr>
				</thead>
				<tbody>
					{NEST_ENV_ROWS.map((row) => {
						return (
							<tr key={row.name}>
								<td>
									<code>{row.name}</code>
								</td>
								<td>{envDefaultCell(row.default)}</td>
								<td>
									<RichText text={row.meaning} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	)
};

export const responsesSection: DocSection = {
	...meta('the-responses'),
	body: (
		<>
			<p>
				Every JSON response is one envelope: <code>{'{ status, message, data }'}</code>, errors included. The examples
				below are copied from a real run of the built app.
			</p>
			{NEST_RESPONSES.map((example) => {
				return (
					<Fragment key={example.title}>
						<p>{example.title}</p>
						<CodeBlock
							code={example.curl}
							language="sh"
							title="the request"
							headerAction={
								<CopyButton feedback="icon" label={`Copy the curl for ${example.title}`} value={example.curl} />
							}
						/>
						<CodeBlock code={example.output} language="json" title="the answer" />
						{example.note === undefined ? null : (
							<p>
								<RichText text={example.note} />
							</p>
						)}
					</Fragment>
				);
			})}
		</>
	)
};
