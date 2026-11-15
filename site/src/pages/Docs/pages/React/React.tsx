import CodeBlock from '@/components/CodeBlock/CodeBlock';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import {
	REACT_CONVENTIONS_PARAGRAPHS,
	REACT_MONOREPO_PARAGRAPHS,
	REACT_SCRIPTS,
	meta
} from '@/pages/Docs/pages/React/React.constant';
import {
	environmentSection,
	whatIsNotThereYetSection,
	whatItWritesSection
} from '@/pages/Docs/pages/React/ReactSections';

const React = () => {
	return (
		<DocPage
			title="react"
			summary="The react preset: the app it writes, the environment, the conventions, the scripts and the monorepo."
			sections={[
				whatItWritesSection,
				environmentSection,
				{
					...meta('the-conventions'),
					body: (
						<>
							{REACT_CONVENTIONS_PARAGRAPHS.map((paragraph) => {
								return (
									<p key={paragraph}>
										<RichText text={paragraph} />
									</p>
								);
							})}
						</>
					)
				},
				{
					...meta('the-scripts'),
					body: (
						<>
							<p>
								The scripts the generated <code>package.json</code> carries, read from the template:
							</p>
							<CodeBlock code={REACT_SCRIPTS} language="json" title="package.json" />
						</>
					)
				},
				{
					...meta('the-monorepo'),
					body: (
						<>
							{REACT_MONOREPO_PARAGRAPHS.map((paragraph) => {
								return (
									<p key={paragraph}>
										<RichText text={paragraph} />
									</p>
								);
							})}
						</>
					)
				},
				whatIsNotThereYetSection
			]}
		/>
	);
};

export default React;
