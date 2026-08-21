import { AgentName } from 'package-manager-detector'

export interface DetectedPM {
	pm: AgentName
	version: string
}
