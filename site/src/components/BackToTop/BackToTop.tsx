import { cn } from '@jjuidev/design-system';
import { ArrowUp } from 'lucide-react';
import { ComponentProps, useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

export interface BackToTopProps extends ComponentProps<'button'> {}

const BackToTop = ({ className, ...props }: BackToTopProps) => {
	const [isVisible, setIsVisible] = useState(false);
	const frameRef = useRef(0);

	/*
	 * The button waits until the reader has left the top of the page before it offers itself,
	 * and it steps aside near the page bottom, where the footer's fine print lives, so the two
	 * never share a pixel. Both signals come from one rAF-throttled scroll listener: an
	 * observer would need a sentinel at one-viewport depth, and the listener on `window` needs
	 * no layout cooperation.
	 */
	useEffect(() => {
		const update = () => {
			const viewport = window.innerHeight;
			const pageHeight = document.documentElement.scrollHeight;
			const hasScrolled = window.scrollY > viewport;
			const nearBottom = window.scrollY + viewport >= pageHeight - viewport * 0.5;

			setIsVisible(hasScrolled && !nearBottom);
		};

		const schedule = () => {
			if (frameRef.current !== 0) {
				return;
			}

			frameRef.current = window.requestAnimationFrame(() => {
				frameRef.current = 0;
				update();
			});
		};

		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);

		return () => {
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
			window.cancelAnimationFrame(frameRef.current);
		};
	}, []);

	const scrollToTop = () => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		window.scrollTo({
			top: 0,
			behavior: reduce ? 'auto' : 'smooth'
		});
	};

	return isVisible ? (
		<button
			type="button"
			className={cn(styles.root, className)}
			aria-label="Back to top"
			onClick={scrollToTop}
			{...props}
		>
			<ArrowUp size={18} aria-hidden="true" />
		</button>
	) : null;
};

export default BackToTop;
