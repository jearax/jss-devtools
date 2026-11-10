/**
 * The name of the event the search palette listens for.
 *
 * The trigger and the palette are mounted in different parts of the tree — the trigger in the
 * header, the palette in the layout — and neither owns the other. A DOM event on `window` is
 * the seam between them: the trigger dispatches it, the palette listens for it, and neither
 * imports the other. A React context would make both depend on a provider that has to sit
 * above the header, which buys nothing here.
 */
export const SEARCH_OPEN_EVENT = 'jss-devtools:search-open';

/** The palette's shortcut; `Mod` is Command on macOS and Control elsewhere. */
export const SEARCH_HOTKEY = 'Mod+K';

/** The hint the trigger shows, so the reader knows the shortcut before pressing it. */
export const SEARCH_TRIGGER_LABEL = 'Search the docs';

/** The name of the palette's dialog, for the screen reader. */
export const SEARCH_PALETTE_TITLE = 'Search the docs';

/** The name of the palette's input. */
export const SEARCH_INPUT_LABEL = 'Search the docs';

/** The name of the palette's result list. */
export const SEARCH_LIST_LABEL = 'Search results';

/** Where the palette offers a way in when nothing matched. */
export const SEARCH_EMPTY_HREF = '/docs/getting-started';
