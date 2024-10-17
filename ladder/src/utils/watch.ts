export type StopWatch = {
	/** Start the stopwatch */
	start: () => void;
	/** Stop the stopwatch */
	stop: () => void;
	/** Reset the stopwatch */
	reset: () => void;
	/** Elapsed ms */
	elapsed: () => number;
};

/** Creates a new stopwatch instance 
 * 
 * @returns 
 * 
 * # Usage
 * ```ts
 * const w = watch();
 * 
 * w.start();
 * 
 * await sleep(1000);
 * 
 * console.log(w.elapsed()); // 1000
 * ```
 */
const watch = (): StopWatch => {
	let startedAt: number | undefined = undefined;
	let endedAt: number | undefined = undefined;

	return {
		start: () => (startedAt = Date.now()),
		stop: () => (endedAt = Date.now()),
		elapsed: () => {
			if (!startedAt) {
				throw new Error("Call `.start()` first!");
			}

			let tempEndedAt = endedAt;

			if (!tempEndedAt) {
				tempEndedAt = Date.now();
			}

			return tempEndedAt - startedAt;
		},
		reset: () => {
			endedAt = undefined;
			startedAt = undefined;
		},
	};
};

export { watch };
