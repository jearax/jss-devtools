import { cn } from '@jjuidev/design-system';
import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';

import Breadcrumbs from '@/pages/Docs/components/Breadcrumbs/Breadcrumbs';
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
	const [activeId, setActiveId] = useState<string | null>(null);
	const proseRef = useRef<HTMLDivElement>(null);

	/*
	 * The pages build their sections on every render, so the observer watches the ids rather than
	 * the array: the ids are what it reads, and they do not change while the page is open.
	 */
	const sectionIds = sections
		.map((section) => {
			return section.id;
		})
		.join(' ');

	useEffect(() => {
		const prose = proseRef.current;

		if (prose === null) {
			return;
		}

		const ids = sectionIds.split(' ').filter(Boolean);
		const onScreen = new Set<string>();

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						onScreen.add(entry.target.id);
					} else {
						onScreen.delete(entry.target.id);
					}
				}

				// The topmost heading that is on screen is the one the reader is at.
				const active = ids.find((id) => {
					return onScreen.has(id);
				});

				if (active !== undefined) {
					setActiveId(active);
				}
			},
			/* The band is the top of the viewport, under the sticky header. */
			{ rootMargin: '-96px 0px -60% 0px' }
		);

		for (const id of ids) {
			const target = prose.querySelector(`#${CSS.escape(id)}`);

			if (target !== null) {
				observer.observe(target);
			}
		}

		return () => {
			observer.disconnect();
		};
	}, [sectionIds]);

	return (
		<article className={cn(styles.root, className)} {...props}>
			<Breadcrumbs />

			<h1 className={styles.title}>{title}</h1>
			<p className={styles.summary}>{summary}</p>

			<div className={styles.body}>
				<div className={styles.prose} ref={proseRef}>
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
