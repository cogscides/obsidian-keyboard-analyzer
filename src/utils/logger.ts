import { getLogLevel, isDevLoggingEnabled } from "./runtimeConfig";

type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Record<Level, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

function shouldLog(level: Level): boolean {
	if (!isDevLoggingEnabled()) return false;
	const current = getLogLevel();
	return levelOrder[level] >= levelOrder[current];
}

function format(args: unknown[]) {
	try {
		return args;
	} catch {
		return args;
	}
}

function nowMs(): number {
	if (typeof performance !== "undefined" && performance.now) {
		return performance.now();
	}
	return Date.now();
}

// Timing/profiling support (aggregates durations per label)
const _startTimes = new Map<string, number>();
const _aggregates: Record<
	string,
	{ count: number; totalMs: number; lastMs: number }
> = {};

function timeStart(label: string) {
	if (!isDevLoggingEnabled()) return;
	_startTimes.set(label, nowMs());
}

// Minimum duration (ms) to emit immediate debug timing logs to avoid noisy output.
const MIN_IMMEDIATE_TIMING_MS = 5;
function timeEnd(label: string) {
	if (!isDevLoggingEnabled()) return;
	const start = _startTimes.get(label);
	if (!start) return;
	const duration = nowMs() - start;
	_startTimes.delete(label);
	const agg = _aggregates[label] || { count: 0, totalMs: 0, lastMs: 0 };
	agg.count += 1;
	agg.totalMs += duration;
	agg.lastMs = duration;
	_aggregates[label] = agg;

	// Emit immediate debug only for meaningful durations or during initial samples.
	// This avoids flooding the console with many sub-ms or tiny timings.
	const shouldEmitImmediate =
		duration >= MIN_IMMEDIATE_TIMING_MS || agg.count <= 3;
	if (shouldEmitImmediate && shouldLog("debug")) {
		console.debug("[KB][timing]", label, `${duration.toFixed(2)}ms`);
	}
}

function dumpTimings() {
	if (!isDevLoggingEnabled()) return;
	const lines: string[] = [];
	for (const [label, agg] of Object.entries(_aggregates)) {
		const avg = agg.totalMs / Math.max(1, agg.count);
		lines.push(
			`${label}: count=${agg.count} avg=${avg.toFixed(
				2,
			)}ms last=${agg.lastMs.toFixed(2)}ms total=${agg.totalMs.toFixed(2)}ms`,
		);
	}
	if (lines.length) {
		// Print only top 8 slowest entries to avoid flooding
		const sorted = lines
			.map((l) => {
				const m = l.match(/avg=([0-9.]+)ms/);
				const avg = m ? Number.parseFloat(m[1]) : 0;
				return { line: l, avg };
			})
			.sort((a, b) => b.avg - a.avg)
			.slice(0, 8)
			.map((s) => s.line);
		console.info(
			"[KB][timings] aggregated timings (top " +
				String(sorted.length) +
				"):\n" +
				sorted.join("\n"),
		);
	} else {
		console.info("[KB][timings] no timings recorded");
	}
}

export const logger = {
	debug: (...args: unknown[]) => {
		if (shouldLog("debug")) console.debug("[KB]", ...format(args));
	},
	info: (...args: unknown[]) => {
		if (shouldLog("info")) console.info("[KB]", ...format(args));
	},
	warn: (...args: unknown[]) => {
		if (shouldLog("warn")) console.warn("[KB]", ...format(args));
	},
	error: (...args: unknown[]) => {
		if (shouldLog("error")) console.error("[KB]", ...format(args));
	},
	timeStart,
	timeEnd,
	dumpTimings,
};

export default logger;
