import { defineSkin } from '@jjuidev/styles/theme';

/**
 * The site's own skin. The values live in `jss-devtools.css` next to this file; `defineSkin` only names
 * the skin and loads no CSS. The id is the one the pre-paint script in `index.html` writes, so the two
 * stay in step.
 */
export const JSS_DEVTOOLS_SKIN = defineSkin({
	id: 'jss-devtools',
	label: 'jss-devtools'
});

declare module '@jjuidev/styles/theme' {
	interface Register {
		skins: [typeof JSS_DEVTOOLS_SKIN];
	}
}
