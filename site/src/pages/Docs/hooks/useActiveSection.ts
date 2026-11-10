import { useWindowEvent } from '@mantine/hooks';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

const sectionOffset = (element: HTMLElement) => {
	return Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
};

// The last section whose top has passed its scroll margin is the one being read; at the page end the last one wins.
export const findActive = (elements: readonly HTMLElement[]): string | null => {
	if (elements.length === 0) {
		return null;
	}

	const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

	if (atBottom) {
		return elements[elements.length - 1]?.id ?? null;
	}

	let activeId: string | null = elements[0]?.id ?? null;

	for (const element of elements) {
		if (element.getBoundingClientRect().top <= sectionOffset(element) + 1) {
			activeId = element.id;
		}
	}

	return activeId;
};

// Not Mantine's useScrollSpy, which moves on while the reader is still inside a long section.
const useActiveSection = (ids: readonly string[]) => {
	const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
	const frame = useRef(0);
	const key = ids.join('|');

	const update = () => {
		frame.current = 0;

		const elements = ids.flatMap((id) => {
			const element = document.getElementById(id);

			return element ? [element] : [];
		});

		setActiveId(findActive(elements));
	};

	const schedule = () => {
		if (frame.current === 0) {
			frame.current = requestAnimationFrame(update);
		}
	};

	const scheduleOnSectionsChange = useEffectEvent(schedule);

	useWindowEvent('scroll', schedule, { passive: true });
	useWindowEvent('resize', schedule);
	useWindowEvent('hashchange', schedule);

	useEffect(() => {
		scheduleOnSectionsChange();

		return () => {
			cancelAnimationFrame(frame.current);
			frame.current = 0;
		};
	}, [key]);

	return activeId;
};

export default useActiveSection;
