export type Framework = 'node' | 'react' | 'react-native' | 'nextjs'

export type SetupAnswers = {
	framework: Framework
	useTailwind?: boolean
	useStorybook?: boolean
	useAliasImport: boolean
}

export interface PackageToInstall {
	name: string | string[]
	dev: boolean
	condition?: (answers: SetupAnswers) => boolean
}
