import { cn } from '@jjuidev/design-system';
import { ComponentProps, ReactNode } from 'react';
import { NavLink } from 'react-router';

import Pager from '@/pages/Docs/components/Pager/Pager';

import styles from './styles.module.css';

export type DocSection = {
	/** The anchor the table of contents links to. */
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
	return (
		<article className={cn(styles.root, className)} {...props}>
			<nav className={styles.breadcrumb} aria-label="Breadcrumb">
				<NavLink className={styles.breadcrumbLink ?? ''} to="/docs">
					Docs
				</NavLink>
				<span className={styles.breadcrumbSep} aria-hidden="true">
					/
				</span>
				<span aria-current="page">{title}</span>
			</nav>

			<h1 className={styles.title}>{title}</h1>
			<p className={styles.summary}>{summary}</p>

			<div className={styles.body}>
				<div className={styles.prose}>
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
										<a className={styles.tocLink} href={`#${section.id}`}>
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
