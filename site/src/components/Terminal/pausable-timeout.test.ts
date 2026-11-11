import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import usePausableTimeout from './pausable-timeout';

describe('usePausableTimeout', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('runs the job after its wait', async () => {
		vi.useFakeTimers();

		const { result, act } = await renderHook(() => {
			return usePausableTimeout();
		});

		const job = vi.fn();

		await act(() => {
			result.current.start(job, 500);
		});

		vi.advanceTimersByTime(499);
		expect(job).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(job).toHaveBeenCalledTimes(1);
	});

	it('pause keeps the rest, and resume schedules exactly that rest', async () => {
		vi.useFakeTimers();

		const { result, act } = await renderHook(() => {
			return usePausableTimeout();
		});

		const job = vi.fn();

		await act(() => {
			result.current.start(job, 1000);
		});

		vi.advanceTimersByTime(400);
		await act(() => {
			result.current.pause();
		});

		// Waiting far past the original wait must not run the job while paused.
		vi.advanceTimersByTime(10_000);
		expect(job).not.toHaveBeenCalled();

		await act(() => {
			result.current.resume();
		});

		vi.advanceTimersByTime(599);
		expect(job).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(job).toHaveBeenCalledTimes(1);
	});

	it('a job started while paused waits for the resume', async () => {
		vi.useFakeTimers();

		const { result, act } = await renderHook(() => {
			return usePausableTimeout();
		});

		const job = vi.fn();

		await act(() => {
			result.current.pause();
		});

		await act(() => {
			result.current.start(job, 300);
		});

		vi.advanceTimersByTime(10_000);
		expect(job).not.toHaveBeenCalled();

		await act(() => {
			result.current.resume();
		});

		vi.advanceTimersByTime(299);
		expect(job).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(job).toHaveBeenCalledTimes(1);
	});

	it('clear cancels the job, and a later resume runs nothing', async () => {
		vi.useFakeTimers();

		const { result, act } = await renderHook(() => {
			return usePausableTimeout();
		});

		const job = vi.fn();

		await act(() => {
			result.current.start(job, 200);
		});

		await act(() => {
			result.current.clear();
		});

		vi.advanceTimersByTime(10_000);
		expect(job).not.toHaveBeenCalled();

		await act(() => {
			result.current.resume();
		});

		expect(job).not.toHaveBeenCalled();
	});
});
