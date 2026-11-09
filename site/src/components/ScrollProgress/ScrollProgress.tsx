import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, useEffect, useRef } from 'react';

import styles from './styles.module.css';

export interface ScrollProgressProps extends ComponentProps<'div'> {}

const ScrollProgress = ({ className, ...props }: ScrollProgressProps) => {
	const bar = useRef<HTMLDivElement>(null);
	const frame = useRef(0);

	useEffect(() => {
		/*
		 * Written to a CSS variable, not React state, so scrolling never re-renders the header. The
		 * progress is measured against the page's scrollable height, not the viewport: the viewport
		 * counts a horizontal scrollbar, so the bar would reach 100% early.
		 */
		const update = () => {
			frame.current = 0;

			const element = bar.current;
			const root = document.documentElement;
			const scrollable = root.scrollHeight - root.clientHeight;

			if (element === null) {
				return;
			}

			element.dataset.scrollable = String(scrollable > 0);
			element.style.setProperty(
				'--scroll-progress',
				String(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0)
			);
		};

		// One frame in flight at a time: the coalescing is the throttle.
		const schedule = () => {
			if (frame.current === 0) {
				frame.current = requestAnimationFrame(update);
			}
		};

		update();

		// The page grows after mount (lazy routes, web fonts), which changes the total without a scroll.
		const observer = new ResizeObserver(schedule);

		observer.observe(document.body);

		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
			cancelAnimationFrame(frame.current);
			frame.current = 0;
		};
	}, []);

	return <div ref={bar} className={cn(styles.root, className)} data-scrollable="false" aria-hidden="true" {...props} />;
};

export default ScrollProgress;
