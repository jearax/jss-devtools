import { useEffect, useEffectEvent, useRef } from 'react';

// Passing history.state keeps React Router's entry intact, and a replace adds no history entry.
const replaceSectionHash = (id: string | null) => {
	const base = `${window.location.pathname}${window.location.search}`;

	window.history.replaceState(window.history.state, '', id ? `${base}#${id}` : base);
};

const topOffset = (id: string) => {
	const element = document.getElementById(id);

	return element ? Number.parseFloat(getComputedStyle(element).scrollMarginTop) + 1 : 1;
};

// The URL follows the section being read, so a copied link opens where the reader is.
const useSectionHash = (activeId: string | null, ids: readonly string[]) => {
	const written = useRef<string | null>(window.location.hash.slice(1) || null);
	const settled = useRef(false);

	const syncHash = useEffectEvent((id: string | null) => {
		if (!settled.current) {
			// Wait for the jump to a shared link, so the first frame does not overwrite its hash.
			if (window.scrollY > 0 || id === written.current) {
				settled.current = true;
			} else {
				return;
			}
		}

		if (id === written.current) {
			return;
		}

		// The top of the page carries no hash.
		if (id && id === ids[0] && window.scrollY <= topOffset(id)) {
			replaceSectionHash(null);
			written.current = null;
			return;
		}

		replaceSectionHash(id);
		written.current = id;
	});

	useEffect(() => {
		syncHash(activeId);
	}, [activeId]);
};

export default useSectionHash;
