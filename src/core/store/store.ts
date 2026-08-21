// Persistent store via `conf` (community pattern — configstore/update-notifier lineage).
// conf handles per-platform config locations (Linux XDG ~/.config, macOS
// ~/Library/Preferences, Windows %APPDATA%), atomic writes, and dot-prop keys.
//
// Single store, namespaced keys:
//   pmLedger — { pmsSeen, lastPm, lastSeenAt }: PM install history (derived, safe to delete)
//   pm       — user's explicit PM override (future)
//
// Graceful degradation (kongming gate #2): conf performs NO I/O in its
// constructor — EACCES/EROFS surface lazily at get/set time (dir creation,
// file read). Every helper therefore wraps its I/O: on permission errors or
// corrupted JSON it degrades to stateless defaults instead of crashing the
// command (ledger is derived data — losing it is always acceptable).
// clearInvalidConfig lets conf self-heal a corrupted config.json.
// JSS_DEVTOOLS_STORE_DIR overrides the location (tests).
import Conf from 'conf'
import { AgentName } from 'package-manager-detector'

import { logger } from '@/utils/logger'

export interface PmLedger {
	pmsSeen: AgentName[]
	lastPm: AgentName | null
	lastSeenAt: string | null
}

const EMPTY_LEDGER: PmLedger = {
	pmsSeen: [],
	lastPm: null,
	lastSeenAt: null
}

const cwd = process.env.JSS_DEVTOOLS_STORE_DIR

// `clearInvalidConfig` makes the constructor eagerly read + self-heal the
// config file — fs permission errors (EACCES/EROFS) therefore surface HERE on
// read-only HOME/CI. Degrade to a null store; helpers are null-safe.
const isDegradableError = (err: unknown): boolean => {
	const code = (err as NodeJS.ErrnoException)?.code

	return code === 'EACCES' || code === 'EROFS' || err instanceof SyntaxError
}

const buildStore = (): Conf | null => {
	try {
		return new Conf({
			projectName: 'jss-devtools',
			clearInvalidConfig: true,
			...(cwd ? { cwd } : {})
		})
	} catch (err) {
		if (isDegradableError(err)) {
			logger.debug('config directory not writable or corrupted — running stateless')
			return null
		}

		throw err
	}
}

const store = buildStore()

// Degrade to `fallback` on filesystem errors at get/set time (write failures,
// races) — rethrow anything else (bugs should stay visible).
const safe = <T>(op: () => T, fallback: T): T => {
	try {
		return op()
	} catch (err) {
		if (isDegradableError(err)) {
			logger.debug('store write/read failed — stateless for this operation')
			return fallback
		}

		throw err
	}
}

export const getPmLedger = (): PmLedger =>
	(store && safe(() => (store.get('pmLedger') as PmLedger | undefined) ?? EMPTY_LEDGER, EMPTY_LEDGER)) || EMPTY_LEDGER

export const recordPmSeen = (pm: AgentName): void => {
	if (!store) {
		return
	}

	safe(() => {
		const ledger = getPmLedger()

		store.set('pmLedger', {
			pmsSeen: [...new Set([...ledger.pmsSeen, pm])],
			lastPm: pm,
			lastSeenAt: new Date().toISOString()
		})
	}, undefined)
}

export const getPmOverride = (): AgentName | null =>
	(store && safe(() => (store.get('pm') as AgentName | undefined) ?? null, null)) || null

export const setPmOverride = (pm: AgentName | null): void => {
	if (!store) {
		return
	}

	safe(() => {
		if (pm === null) {
			store.delete('pm')
		} else {
			store.set('pm', pm)
		}
	}, undefined)
}

/** Absolute path of the backing JSON file (debug/logging). */
export const storePath = (): string | null => (store && safe(() => store.path, null)) || null
