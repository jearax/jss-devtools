import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import FeatureRow from '@/pages/Home/components/FeatureRow/FeatureRow';
import GettingStarted from '@/pages/Home/components/GettingStarted/GettingStarted';
import Hero from '@/pages/Home/components/Hero/Hero';

import styles from './styles.module.css';

export interface HomeProps extends ComponentProps<'div'> {}

const Home = ({ className, ...props }: HomeProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<Hero />
			<FeatureRow />
			<GettingStarted />
		</div>
	);
};

export default Home;
