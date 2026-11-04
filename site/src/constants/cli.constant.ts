/**
 * The facts about the CLI that both routes state. They live here, not in a page, because the home
 * page and the docs area say the same things about the same product.
 *
 * The Node floor is declared once, here. The installer script carries its own copy because a
 * served shell script cannot read a manifest, and the repository's test holds the two together.
 */

export const PRODUCT_NAME = 'jss-devtools';

export const INSTALL_COMMAND = 'curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh';

export const NODE_FLOOR = '>= 24.11.0';

export const REQUIREMENTS = [`Node ${NODE_FLOOR}`, 'curl or wget', 'sha256sum or shasum', '~/.local/bin on PATH'];

export const SOURCE_URL = 'https://github.com/jearax/jss-devtools';

export const SOURCE_LABEL = 'github.com/jearax/jss-devtools';

export const LICENSE = 'MIT';
