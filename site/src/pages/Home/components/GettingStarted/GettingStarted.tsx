import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import { GETTING_STARTED_STEPS } from '@/pages/Home/constants/getting-started.constant';

import styles from './styles.module.css';

export interface GettingStartedProps extends ComponentProps<'section'> {}

const GettingStarted = ({ className, ...props }: GettingStartedProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<h2 className={styles.title}>Getting started</h2>
				</div>

				<div className={styles.steps}>
					{GETTING_STARTED_STEPS.map((step) => {
						return (
							<CodeBlock
								key={step.title}
								className={styles.code}
								code={step.command}
								language="sh"
								prompt="$"
								title={step.title}
								wrap
								headerAction={<CopyButton label={step.copyLabel} value={step.command} />}
							/>
						);
					})}
				</div>

				<a className={styles.link} href="/docs/getting-started">
					Read the getting started guide
				</a>
			</div>
		</section>
	);
};

export default GettingStarted;
