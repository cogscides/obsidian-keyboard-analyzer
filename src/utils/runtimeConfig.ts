// Centralized runtime configuration for cross-module flags
// These settings can be updated from plugin settings and read by utils/components.

export type EmulatedOS = "none" | "windows" | "macos" | "linux";

let devLoggingEnabled = false;
let logLevel: "debug" | "info" | "warn" | "error" = "debug";
let emulatedOS: EmulatedOS = "none";
// Keyboard analyzer runtime flags
let keyListenerScope: "activeView" | "global" = "activeView";
let chordPreviewMode = false;
let searchDebounceMs = 200;

export function setDevLoggingEnabled(enabled: boolean) {
	devLoggingEnabled = !!enabled;
}

export function isDevLoggingEnabled(): boolean {
	return devLoggingEnabled;
}

export function setLogLevel(level: typeof logLevel) {
	logLevel = level;
}

export function getLogLevel() {
	return logLevel;
}

export function setEmulatedOS(os: EmulatedOS) {
	emulatedOS = os;
}

export function getEmulatedOS(): EmulatedOS {
    return emulatedOS;
}

export function isMacOS(): boolean {
	if (emulatedOS === "macos") return true;
	if (emulatedOS === "windows" || emulatedOS === "linux") return false;
	// none → let platform decide at call site (fallbacks use real env when available)
	// Since not all files can import Obsidian's Platform reliably here, callers
	// should provide their own fallback when emulation is 'none'.
	return false;
}

export function isWindows(): boolean {
	if (emulatedOS === "windows") return true;
	if (emulatedOS === "macos" || emulatedOS === "linux") return false;
	return false;
}

export function isLinux(): boolean {
	if (emulatedOS === "linux") return true;
	if (emulatedOS === "macos" || emulatedOS === "windows") return false;
	return false;
}

// Keyboard listener scope: restrict active listener to analyzer view or allow global
export function setKeyListenerScope(scope: "activeView" | "global") {
    keyListenerScope = scope === "global" ? "global" : "activeView";
}

export function getKeyListenerScope(): "activeView" | "global" {
    return keyListenerScope;
}

// Chord preview mode: preview pressed chord and clear on release
export function setChordPreviewMode(enabled: boolean) {
    chordPreviewMode = !!enabled;
}

export function isChordPreviewModeEnabled(): boolean {
    return chordPreviewMode;
}

// Search debounce (ms)
export function setSearchDebounceMs(ms: number) {
    const v = Number(ms);
    searchDebounceMs = Number.isFinite(v) ? Math.max(0, Math.min(2000, v)) : 200;
}

export function getSearchDebounceMs(): number {
    return searchDebounceMs;
}
