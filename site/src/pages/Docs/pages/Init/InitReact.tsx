import { Link } from 'react-router';

import { docsHref } from '@/constants/routes.constant';
import { DocSection } from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { INIT_REACT_PARAGRAPHS, meta } from '@/pages/Docs/pages/Init/Init.constant';

export const reactSection: DocSection = {
	...meta('the-react-preset'),
	body: (
		<>
			{INIT_REACT_PARAGRAPHS.map((paragraph) => {
				return (
					<p key={paragraph}>
						<RichText text={paragraph} />
					</p>
				);
			})}
			<p>
				<Link to={docsHref('react')}>
					The react page documents the tree, the environment, the conventions, the scripts and the monorepo.
				</Link>
			</p>
		</>
	)
};
