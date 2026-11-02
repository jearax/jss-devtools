/**
 * The JSS block letters in figlet's ANSI Shadow font, generated with `figlet -f "ANSI Shadow" JSS`;
 * the bundle ships without `node_modules`, so figlet cannot run here.
 */
export const BANNER_ART = [
	'     ██╗███████╗███████╗',
	'     ██║██╔════╝██╔════╝',
	'     ██║███████╗███████╗',
	'██   ██║╚════██║╚════██║',
	'╚█████╔╝███████║███████║',
	' ╚════╝ ╚══════╝╚══════╝'
] as const;

export const DS_MOSS_300 = '#a8d558';
export const DS_MOSS_400 = '#8abd2c';
export const DS_MOSS_500 = '#5e8c04';

export const PLATFORM_NAMES: Record<string, string> = {
	darwin: 'macOS',
	win32: 'Windows',
	linux: 'Linux'
};
