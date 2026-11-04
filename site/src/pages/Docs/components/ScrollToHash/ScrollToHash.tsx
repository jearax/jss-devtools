import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * The jump to a section.
 *
 * The router does not scroll to a hash, and a docs page is a lazy route: the browser's own jump
 * happens before the section exists. This waits for the section and scrolls to it once it is
 * there.
 */
const ScrollToHash = () => {
	const { hash, pathname } = useLocation();

	useEffect(() => {
		const id = hash.replace('#', '');

		if (id === '') {
			return;
		}

		let cancelled = false;
		let observer: MutationObserver | null = null;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const jump = (): boolean => {
			const target = document.getElementById(id);

			if (target === null) {
				return false;
			}

			target.scrollIntoView({ behavior: 'instant' });

			return true;
		};

		const settle = () => {
			/*
			 * The web fonts arrive after the jump and move the text they are in, so the jump is
			 * done again once they are in. The reader's own scroll is left alone: if the page has
			 * moved since the jump, the reader has taken over.
			 */
			const jumpedTo = window.scrollY;

			void document.fonts.ready.then(() => {
				if (!cancelled && window.scrollY === jumpedTo) {
					jump();
				}
			});
		};

		if (!jump()) {
			observer = new MutationObserver(() => {
				if (jump()) {
					observer?.disconnect();
					settle();
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true
			});

			// The section may never arrive. The observer stops rather than watch the page forever.
			timer = setTimeout(() => {
				observer?.disconnect();
			}, 2000);
		} else {
			settle();
		}

		return () => {
			cancelled = true;
			observer?.disconnect();

			if (timer !== null) {
				clearTimeout(timer);
			}
		};
	}, [hash, pathname]);

	return null;
};

export default ScrollToHash;
