import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import Closing from '@/pages/Home/components/Closing/Closing';
import Commands from '@/pages/Home/components/Commands/Commands';
import Gap from '@/pages/Home/components/Gap/Gap';
import Harness from '@/pages/Home/components/Harness/Harness';
import Hero from '@/pages/Home/components/Hero/Hero';
import Install from '@/pages/Home/components/Install/Install';
import Reference from '@/pages/Home/components/Reference/Reference';
import Requirements from '@/pages/Home/components/Requirements/Requirements';

import styles from './styles.module.css';

export interface HomeProps extends ComponentProps<'div'> {}

const Home = ({ className, ...props }: HomeProps) => {
	return (
		<div className={cn(styles.root, className)} {...props}>
			<Hero />
			<Gap />
			<Commands />
			<Harness />
			<Install />
			<Reference />
			<Requirements />
			<Closing />
		</div>
	);
};

export default Home;
