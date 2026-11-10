import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import { flattenTree } from '@/pages/Home/components/FileTree/file-tree.util';
import { REPOSITORY_TREE } from '@/pages/Home/constants/repository-tree.constant';

import styles from './styles.module.css';

export interface FileTreeProps extends ComponentProps<'div'> {}

const lines = flattenTree(REPOSITORY_TREE);

const FileTree = ({ className, ...props }: FileTreeProps) => {
	return (
		<div className={cn(styles.root, className)} role="img" aria-label="The files init writes into a project" {...props}>
			<p className={styles.line}>{`${'my-app'}/`}</p>
			{lines.map((node) => {
				return (
					<p key={node.path} className={styles.line}>
						<span className={styles.glyph} aria-hidden="true">
							{node.branch}
						</span>
						<span className={styles.name} data-dir={node.dir}>
							{node.name}
						</span>
					</p>
				);
			})}
		</div>
	);
};

export default FileTree;
