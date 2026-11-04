import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { Outlet } from 'react-router';

import Sidebar from '@/pages/Docs/components/Sidebar/Sidebar';

import styles from './styles.module.css';

export interface DocsProps extends ComponentProps<'div'> {}

const Docs = ({ className, ...props }: DocsProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<div className={styles.layout}>
				<Sidebar />
				<div className={styles.content}>
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default Docs;
