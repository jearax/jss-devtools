import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, ReactNode } from 'react';

import Breadcrumbs from '@/pages/Docs/components/Breadcrumbs/Breadcrumbs';
import Pager from '@/pages/Docs/components/Pager/Pager';
import useActiveSection from '@/pages/Docs/hooks/useActiveSection';
import useSectionHash from '@/pages/Docs/hooks/useSectionHash';

import styles from './styles.module.css';

export type DocSection = {
	id: string;
	title: string;
	body: ReactNode;
};

export interface DocPageProps extends ComponentProps<'article'> {
	title: string;
	summary: string;
	sections: readonly DocSection[];
}

const DocPage = ({ className, title, summary, sections, ...props }: DocPageProps) => {
	const ids = sections.map((section) => {
		return section.id;
	});

	const activeId = useActiveSection(ids);

	useSectionHash(activeId, ids);

	return (
		<article className={cn(styles.root, className)} {...props}>
			<div className={styles.body}>
				<div className={styles.prose}>
					<Breadcrumbs />

					<h1 className={styles.title}>{title}</h1>
					<p className={styles.summary}>{summary}</p>

					{sections.map((section) => {
						return (
							<section key={section.id} className={styles.section} id={section.id}>
								<h2 className={styles.heading}>{section.title}</h2>
								{section.body}
							</section>
						);
					})}
				</div>

				{sections.length < 2 ? null : (
					<aside className={styles.aside}>
						<p className={styles.asideLabel}>On this page</p>
						<ul className={styles.toc}>
							{sections.map((section) => {
								return (
									<li key={section.id}>
										<a
											className={styles.tocLink}
											href={`#${section.id}`}
											aria-current={activeId === section.id ? 'location' : undefined}
											data-active={activeId === section.id}
										>
											{section.title}
										</a>
									</li>
								);
							})}
						</ul>
					</aside>
				)}
			</div>

			<Pager />
		</article>
	);
};

export default DocPage;
