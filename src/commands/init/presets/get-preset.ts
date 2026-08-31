import { nextPreset } from '@/commands/init/presets/next-preset'
import { nodePreset } from '@/commands/init/presets/node-preset'
import { reactPreset } from '@/commands/init/presets/react-preset'
import { FrameworkPreset } from '@/commands/init/presets/types'
import { FrameworkId } from '@/commands/init/types'

const PRESETS: Record<FrameworkId, FrameworkPreset> = {
	node: nodePreset,
	react: reactPreset,
	next: nextPreset
}

export const getPreset = (framework: FrameworkId): FrameworkPreset => PRESETS[framework]
