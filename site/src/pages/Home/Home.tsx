import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';
import { Link } from 'react-router';

import FeatureRow from '@/pages/Home/components/FeatureRow/FeatureRow';
import Hero from '@/pages/Home/components/Hero/Hero';

import styles from './styles.module.css';

export interface HomeProps extends ComponentProps<'div'> {}

const Home = ({ className, ...props }: HomeProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<Hero />
			<FeatureRow />
			<div className={styles.cta}>
				{/*
				 * The package's Button has no link composition yet, so the link wears the package's
				 * own solid large button recipe, utility by utility, and keeps the router's client
				 * side navigation.
				 */}
				<Link className={styles.ctaButton} to="/docs/getting-started">
					Getting started
				</Link>
			</div>
		</div>
	);
};

export default Home;
