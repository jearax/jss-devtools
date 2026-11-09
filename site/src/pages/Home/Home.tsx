import { cn } from '@jjuidev/styles/variants';
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
				 * The closing band is a section of its own, named for the reader's moment rather than
				 * the button in it, so the page ends with an invitation instead of a stray control.
				 */}
				<section className={styles.ctaBand} aria-label="Get started">
					<p className={styles.ctaLine}>Set up your first repository with it in a minute.</p>
					{/*
					 * The package's Button has no link composition yet, so the link wears the package's
					 * own solid large button recipe, utility by utility, and keeps the router's client
					 * side navigation.
					 */}
					<Link className={styles.ctaButton} to="/docs/getting-started">
						Getting started
					</Link>
				</section>
			</div>
		</div>
	);
};

export default Home;
