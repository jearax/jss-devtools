import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import styles from './styles.module.css';

export interface ShellPromptProps extends ComponentProps<'span'> {
	/** The folder name the prompt shows; `~` is the home folder. */
	dir?: string;
	/** Shows the git segment, as the prompt does inside a repository with uncommitted changes. */
	git?: boolean;
}

// Oh My Zsh's default `robbyrussell` prompt.
const ShellPrompt = ({ className, dir = 'my-app', git = true, ...props }: ShellPromptProps) => {
	return (
		<span className={cn(styles.root, className)} aria-hidden="true" {...props}>
			<span className={styles.promptArrow}>➜</span>
			{'  '}
			<span className={styles.promptDir}>{dir}</span>
			{git && (
				<>
					{' '}
					<span className={styles.promptGit}>git:(</span>
					<span className={styles.promptBranch}>main</span>
					<span className={styles.promptGit}>)</span> <span className={styles.promptDirty}>✗</span>
				</>
			)}
		</span>
	);
};

export default ShellPrompt;
