import { useCallback, useMemo, useRef } from 'react';

export type PausableTimeout = {
	/** Schedules `fn` after `ms`; while paused the job is stored and runs only after `resume`. */
	start: (fn: () => void, ms: number) => void;
	/** Drops the pending or stored job entirely. */
	clear: () => void;
	/** Freezes a pending timeout and keeps its remaining milliseconds. */
	pause: () => void;
	/** Schedules a frozen or stored job for the rest of its wait. */
	resume: () => void;
};

/**
 * A timeout the transcript can freeze: pausing keeps the remaining time, resuming schedules
 * exactly that rest, so a wait survives a pause instead of restarting or being lost.
 */
const usePausableTimeout = (): PausableTimeout => {
	const timer = useRef<number | undefined>(undefined);
	const job = useRef<(() => void) | undefined>(undefined);
	const remaining = useRef(0);
	const startedAt = useRef(0);
	const paused = useRef(false);

	// The paused flag survives a clear: it is the window's state, not the job's, so a timer started
	// while paused stays stored until the reader presses play.
	const clear = useCallback(() => {
		window.clearTimeout(timer.current);
		timer.current = undefined;
		job.current = undefined;
	}, []);

	const fire = useCallback((fn: () => void) => {
		timer.current = undefined;
		job.current = undefined;
		fn();
	}, []);

	const start = useCallback(
		(fn: () => void, ms: number) => {
			clear();
			job.current = fn;
			remaining.current = ms;

			if (paused.current) {
				return;
			}

			startedAt.current = Date.now();
			timer.current = window.setTimeout(() => {
				fire(fn);
			}, ms);
		},
		[clear, fire]
	);

	const pause = useCallback(() => {
		paused.current = true;

		if (timer.current === undefined) {
			return;
		}

		window.clearTimeout(timer.current);
		timer.current = undefined;
		remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
	}, []);

	const resume = useCallback(() => {
		paused.current = false;
		const fn = job.current;

		if (fn === undefined || timer.current !== undefined) {
			return;
		}

		startedAt.current = Date.now();
		timer.current = window.setTimeout(() => {
			fire(fn);
		}, remaining.current);
	}, [fire]);

	return useMemo(() => {
		return {
			start,
			clear,
			pause,
			resume
		};
	}, [start, clear, pause, resume]);
};

export default usePausableTimeout;
