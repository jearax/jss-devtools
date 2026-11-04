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

/** The key the palette opens on, in the notation the platform uses. */
export const SEARCH_HOTKEY = 'k';

/** The hint the trigger shows, so the reader knows the shortcut before pressing it. */
export const SEARCH_TRIGGER_LABEL = 'Search the docs';
