// Centralized runtime configuration for cross-module flags
// These settings can be updated from plugin settings and read by utils/components.

export type EmulatedOS = 'none' | 'windows' | 'macos' | 'linux'

let devLoggingEnabled = false
let logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug'
let emulatedOS: EmulatedOS = 'none'
// Keyboard analyzer runtime flags
let keyListenerScope: 'activeView' | 'global' = 'activeView'
let modifierActivationMode: 'click' | 'press' = 'click'
let searchDebounceMs = 200
let keyboardDevTooltipsEnabled = false

export function setDevLoggingEnabled(enabled: boolean) {
  devLoggingEnabled = !!enabled
}

export function isDevLoggingEnabled(): boolean {
  return devLoggingEnabled
}

export function setLogLevel(level: typeof logLevel) {
  logLevel = level
}

export function getLogLevel() {
  return logLevel
}

export function setEmulatedOS(os: EmulatedOS) {
  emulatedOS = os
}

export function getEmulatedOS(): EmulatedOS {
  return emulatedOS
}

export function isMacOS(): boolean {
  if (emulatedOS === 'macos') return true
  if (emulatedOS === 'windows' || emulatedOS === 'linux') return false
  // none → let platform decide at call site (fallbacks use real env when available)
  // Since not all files can import Obsidian's Platform reliably here, callers
  // should provide their own fallback when emulation is 'none'.
  return false
}

export function isWindows(): boolean {
  if (emulatedOS === 'windows') return true
  if (emulatedOS === 'macos' || emulatedOS === 'linux') return false
  return false
}

export function isLinux(): boolean {
  if (emulatedOS === 'linux') return true
  if (emulatedOS === 'macos' || emulatedOS === 'windows') return false
  return false
}

// Keyboard listener scope: restrict active listener to analyzer view or allow global
export function setKeyListenerScope(scope: 'activeView' | 'global') {
  keyListenerScope = scope === 'global' ? 'global' : 'activeView'
}

export function getKeyListenerScope(): 'activeView' | 'global' {
  return keyListenerScope
}

// Chord preview mode: preview pressed chord and clear on release
// Modifier activation mode
export function setModifierActivationMode(mode: 'click' | 'press') {
  modifierActivationMode = mode === 'press' ? 'press' : 'click'
}

export function getModifierActivationMode(): 'click' | 'press' {
  return modifierActivationMode
}

export function isModifierPressModeEnabled(): boolean {
  return modifierActivationMode === 'press'
}

// Back-compat shims (deprecated): chord preview mapped to press mode
export function setChordPreviewMode(enabled: boolean) {
  modifierActivationMode = enabled ? 'press' : 'click'
}

export function isChordPreviewModeEnabled(): boolean {
  return modifierActivationMode === 'press'
}

// Search debounce (ms)
export function setSearchDebounceMs(ms: number) {
  const v = Number(ms)
  searchDebounceMs = Number.isFinite(v) ? Math.max(0, Math.min(2000, v)) : 200
}

export function getSearchDebounceMs(): number {
  return searchDebounceMs
}

// Keyboard dev tooltips
export function setKeyboardDevTooltipsEnabled(enabled: boolean) {
  keyboardDevTooltipsEnabled = !!enabled
}

export function isKeyboardDevTooltipsEnabled(): boolean {
  return keyboardDevTooltipsEnabled
}
