import { ReactNode } from 'react';

import CodeBlock from '@/components/CodeBlock/CodeBlock';
import { DocSection } from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import {
	REACT_ENV_PARAGRAPHS,
	REACT_ENV_ROWS,
	REACT_NOT_THERE_PARAGRAPHS,
	REACT_TREE,
	meta
} from '@/pages/Docs/pages/React/React.constant';

const envDefaultCell = (value: string): ReactNode => {
	return value === '' ? <em>unset</em> : <code>{value}</code>;
};

export const whatItWritesSection: DocSection = {
	...meta('what-it-writes'),
	body: (
		<>
			<p>
				<code>jss-devtools init my-web --framework react --pm pnpm -y</code> creates the project: the app below, the
				shared toolchain around it, and <code>pnpm install</code> with the chosen manager.
			</p>
			<CodeBlock code={REACT_TREE} title="the src/ tree" />
		</>
	)
};

export const environmentSection: DocSection = {
	...meta('the-environment'),
	body: (
		<>
			{REACT_ENV_PARAGRAPHS.map((paragraph) => {
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
					{REACT_ENV_ROWS.map((row) => {
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

export const whatIsNotThereYetSection: DocSection = {
	...meta('what-is-not-there-yet'),
	body: (
		<>
			{REACT_NOT_THERE_PARAGRAPHS.map((paragraph) => {
				return (
					<p key={paragraph}>
						<RichText text={paragraph} />
					</p>
				);
			})}
		</>
	)
};
