import CodeBlock from '@/components/CodeBlock/CodeBlock';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { NEST_LANGUAGE_CURLS } from '@/pages/Docs/pages/Nest/constants/examples.constant';
import {
	NEST_HEALTH_PARAGRAPHS,
	NEST_LANGUAGE_PARAGRAPHS,
	NEST_MONOREPO_PARAGRAPHS,
	NEST_SCRIPTS,
	meta
} from '@/pages/Docs/pages/Nest/Nest.constant';
import {
	environmentSection,
	exampleDomainSection,
	responsesSection,
	whatItWritesSection
} from '@/pages/Docs/pages/Nest/NestSections';

const Nest = () => {
	return (
		<DocPage
			title="nest"
			summary="The nest preset: the app it writes, the environment, the responses and the health route."
			sections={[
				whatItWritesSection,
				exampleDomainSection,
				environmentSection,
				responsesSection,
				{
					...meta('the-language'),
					body: (
						<>
							{NEST_LANGUAGE_PARAGRAPHS.map((paragraph) => {
								return (
									<p key={paragraph}>
										<RichText text={paragraph} />
									</p>
								);
							})}
							<CodeBlock code={NEST_LANGUAGE_CURLS} language="sh" title="the language curls" />
						</>
					)
				},
				{
					...meta('the-health-route'),
					body: (
						<>
							{NEST_HEALTH_PARAGRAPHS.map((paragraph) => {
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
							<CodeBlock code={NEST_SCRIPTS} language="json" title="package.json" />
						</>
					)
				},
				{
					...meta('the-monorepo'),
					body: (
						<>
							{NEST_MONOREPO_PARAGRAPHS.map((paragraph) => {
								return (
									<p key={paragraph}>
										<RichText text={paragraph} />
									</p>
								);
							})}
						</>
					)
				}
			]}
		/>
	);
};

export default Nest;
