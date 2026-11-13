import { Link } from 'react-router';

import { docsHref } from '@/constants/routes.constant';
import { DocSection } from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { INIT_PRESETS } from '@/pages/Docs/Docs.constant';
import { INIT_NEST_PARAGRAPHS, meta } from '@/pages/Docs/pages/Init/Init.constant';

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
			<p>
				<Link to={docsHref('nest')}>
					The nest page documents the tree, the environment, the responses, the language and the health route.
				</Link>
			</p>
		</>
	)
};
