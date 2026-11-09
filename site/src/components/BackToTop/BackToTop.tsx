import { cn } from '@jjuidev/styles/variants';
import { ArrowUp } from 'lucide-react';
import { ComponentProps, useEffect, useState } from 'react';

import styles from './styles.module.css';

export interface BackToTopProps extends ComponentProps<'button'> {}

const BackToTop = ({ className, ...props }: BackToTopProps) => {
	const [visible, setVisible] = useState(false);

	/*
	 * The button waits until the reader has left the top of the page before it offers itself, and
	 * it stays once it is up: nothing else lives in its corner any more, so it never has to step
	 * aside.
	 */
	useEffect(() => {
		const update = () => {
			setVisible(window.scrollY > window.innerHeight);
		};

		update();
		window.addEventListener('scroll', update, { passive: true });

		return () => {
			window.removeEventListener('scroll', update);
		};
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
	};

	return (
		<button
			type="button"
			className={cn(styles.backToTop, className)}
			onClick={scrollToTop}
			data-visible={visible}
			aria-hidden={!visible}
			aria-label="Back to top"
			{...props}
		>
			<ArrowUp size={18} aria-hidden="true" />
		</button>
	);
};

export default BackToTop;
