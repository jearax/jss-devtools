import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import CommandsBand from '@/pages/Home/components/CommandsBand/CommandsBand';
import FileTree from '@/pages/Home/components/FileTree/FileTree';
import Hero from '@/pages/Home/components/Hero/Hero';
import { HARNESS_POINTS } from '@/pages/Home/constants/repository-tree.constant';

import styles from './styles.module.css';

export interface HomeProps extends ComponentProps<'div'> {}

const Home = ({ className, ...props }: HomeProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<Hero />
			<CommandsBand />

			<section className={styles.repository} aria-label="What lands in your repository">
				<div className={styles.repositoryInner}>
					<div className={styles.repositoryHead}>
						<h2 className={styles.repositoryTitle}>
							What lands in <span className={styles.repositoryTitleMuted}>your repository.</span>
						</h2>
						<ul className={styles.points}>
							{HARNESS_POINTS.map((point) => {
								return (
									<li key={point.title} className={styles.point}>
										<p className={styles.pointTitle}>{point.title}</p>
										<p className={styles.pointText}>{point.text}</p>
									</li>
								);
							})}
						</ul>
					</div>
					<FileTree className={styles.tree} />
				</div>
			</section>
		</div>
	);
};

export default Home;
