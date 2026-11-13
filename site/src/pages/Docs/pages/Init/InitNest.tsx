import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import { DocSection } from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { INIT_PRESETS } from '@/pages/Docs/Docs.constant';
import { INIT_NEST_PARAGRAPHS, meta } from '@/pages/Docs/pages/Init/Init.constant';

const NEST_COMMAND = 'jss-devtools init my-api --framework nest --pm pnpm -y';

export const presetsSection: DocSection = {
	...meta('the-presets'),
	body: (
		<>
			<p>
				<code>--framework</code> declares five choices. Two of them are implemented.
			</p>
			<table>
				<thead>
					<tr>
						<th scope="col">Preset</th>
						<th scope="col">State</th>
					</tr>
				</thead>
				<tbody>
					{INIT_PRESETS.map((preset) => {
						return (
							<tr key={preset.name}>
								<td>
									<code>{preset.name}</code>
								</td>
								<td>{preset.state}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	)
};

export const nestSection: DocSection = {
	...meta('the-nest-preset'),
	body: (
		<>
			{INIT_NEST_PARAGRAPHS.map((paragraph) => {
				return (
					<p key={paragraph}>
						<RichText text={paragraph} />
					</p>
				);
			})}
			<CodeBlock
				code={NEST_COMMAND}
				language="sh"
				title="a Nest app"
				headerAction={<CopyButton feedback="icon" label="Copy the init command" value={NEST_COMMAND} />}
			/>
		</>
	)
};
