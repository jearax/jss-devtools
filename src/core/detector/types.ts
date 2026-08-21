import { AgentName } from 'package-manager-detector'

export type PM = AgentName

export interface DetectedPM {
	pm: AgentName
	version: string
}
