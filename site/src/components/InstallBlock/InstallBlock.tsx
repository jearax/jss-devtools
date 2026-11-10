import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import CopyButton from '@/components/CopyButton/CopyButton';
import ShellCommand from '@/components/ShellCommand/ShellCommand';
import ShellPrompt from '@/components/ShellPrompt/ShellPrompt';
import { INSTALL_COMMAND, INSTALL_PLATFORM_LABEL } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface InstallBlockProps extends ComponentProps<'div'> {}

const InstallBlock = ({ className, ...props }: InstallBlockProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<div className={styles.row}>
				<code className={styles.command}>
					<ShellPrompt dir="~" git={false} /> <ShellCommand command={INSTALL_COMMAND} />
				</code>
				<CopyButton className={styles.copy} feedback="icon" label="Copy the install command" value={INSTALL_COMMAND} />
			</div>
			<p className={styles.note}>{INSTALL_PLATFORM_LABEL}</p>
		</div>
	);
};

export default InstallBlock;
