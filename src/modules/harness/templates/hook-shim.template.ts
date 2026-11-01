export const hookShimTemplate = (nodeFloor: string): string => {
	return `#!/usr/bin/env node
const parts = process.versions.node.split('.').map(Number);
const floor = '${nodeFloor}'.split('.').map(Number);
const below =
	parts[0] < floor[0] ||
	(parts[0] === floor[0] && (parts[1] < floor[1] || (parts[1] === floor[1] && parts[2] < floor[2])));

if (!below) {
	import('./hooks.mjs').catch(function () {});
}
`;
};
