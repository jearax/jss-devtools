export declare const MIN_AGE_MINUTES: number;

export declare const NEST_DEPENDENCIES: readonly string[];
export declare const NEST_DEV_DEPENDENCIES: readonly string[];

export declare const npmView: (args: string[]) => unknown;
export declare const parseVersion: (version: string) => [number, number, number] | null;
export declare const compareVersions: (
	a: [number, number, number] | string,
	b: [number, number, number] | string
) => number;
export declare const comparatorMin: (comparator: string) => [number, number, number] | null;
export declare const comparatorMaxExclusive: (comparator: string) => [number, number, number] | null;
export declare const satisfiesComparator: (version: string, comparator: string) => boolean;
export declare const satisfies: (version: string, range: unknown) => boolean;
export declare const rangeMinVersion: (range: unknown) => [number, number, number];
export declare const isStable: (version: string) => boolean;
export declare const isOldEnough: (publishedAt: string) => boolean;
