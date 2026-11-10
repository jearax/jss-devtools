import { cn } from '@jjuidev/styles/variants';
import { ComponentProps } from 'react';

import { highlightCommand } from '@/components/ShellCommand/shell-command.util';

import styles from './styles.module.css';

export interface ShellCommandProps extends ComponentProps<'span'> {
	command: string;
}

const ShellCommand = ({ className, command, ...props }: ShellCommandProps) => {
	return (
		<span className={cn(styles.root, className)} {...props}>
			{highlightCommand(command).map((word, index) => {
				return (
					<span key={index} className={word.program ? styles.program : undefined}>
						{word.text}
					</span>
				);
			})}
		</span>
	);
};

export default ShellCommand;
