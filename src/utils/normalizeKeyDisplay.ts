import { Platform, type Modifier } from 'obsidian'
import { platformizeModifiers } from './modifierUtils'
import { getEmulatedOS } from './runtimeConfig'

function isMac(): boolean {
  const emu = getEmulatedOS()
  if (emu === 'macos') return true
  if (emu === 'windows' || emu === 'linux') return false
  return Platform.isMacOS
}

// Platform-aware, human-friendly modifier labels (text, not glyphs)
export function getBakedModifierLabel(mod: string | Modifier): string {
  const m = String(mod)
  const mac = isMac()
  if (mac) {
    // macOS: show symbols
    if (m === 'Ctrl' || m === 'Control') return '⌃'
    if (m === 'Shift') return '⇧'
    if (m === 'Alt' || m === 'Option') return '⌥'
    if (m === 'Meta' || m === 'Cmd' || m === 'Win') return '⌘'
    if (m === 'Mod') return '⌘'
    return m
  }
  // Windows/Linux: show words aligned with Obsidian UI
  if (m === 'Ctrl' || m === 'Control' || m === 'Mod') return 'Ctrl'
  if (m === 'Shift') return 'Shift'
  if (m === 'Alt' || m === 'Option') return 'Alt'
  if (m === 'Meta' || m === 'Cmd' || m === 'Win') return 'Win'
  return m
}

function normalizeCodeOrKey(k: string): string {
  // Accepts event.code (e.g., 'KeyA', 'Digit1', 'ArrowUp') or event.key (e.g., 'a', '1', 'ArrowUp')
  const key = (k || '').trim()
  if (!key) return ''

  // Single visible character
  if (key.length === 1) return key.toUpperCase()

  // event.code patterns
  if (key.startsWith('Key') && key.length === 4) return key.slice(3).toUpperCase()
  if (key.startsWith('Digit') && key.length === 6) return key.slice(5)

  return key
}

// Text-first, platform-aware key names
export function getBakedKeyLabel(rawKey: string): string {
  const key = normalizeCodeOrKey(rawKey)
  const mac = isMac()
  const lower = key.toLowerCase()

  const map: Record<string, string> = {
    backspace: '⌫',
    delete: 'Delete',
    del: 'Delete',
    enter: 'Enter',
    return: 'Enter',
    tab: 'Tab',
    escape: 'Esc',
    esc: 'Esc',
    space: '␣',
    ' ': '␣',
    pageup: 'Page Up',
    pagedown: 'Page Down',
    home: 'Home',
    end: 'End',
    insert: 'Ins',
    capslock: 'Caps Lock',
    contextmenu: 'Context Menu',
    context: 'Context Menu',
    menu: 'Context Menu',
    win: 'Win',
    // Arrows → glyphs
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    // Numpad enter
    numpadenter: 'Enter',
    // Numpad operators → glyphs
    numpaddivide: '÷',
    divide: '÷',
    numpadmultiply: '×',
    multiply: '×',
    numpadsubtract: '−',
    subtract: '−',
    numpadadd: '+',
    add: '+',
  }

  if (lower in map) return map[lower]

  // Fallbacks for codes like "Backquote", "Minus", etc.
  const codeMap: Record<string, string> = {
    backquote: '`',
    minus: '-',
    equal: '=',
    bracketleft: '[',
    bracketright: ']',
    backslash: '\\',
    semicolon: ';',
    quote: "'",
    comma: ',',
    period: '.',
    slash: '/',
  }
  if (lower in codeMap) return codeMap[lower]

  // If it still looks like a code, pass through as-is; else upper-case first letter
  return key
}

export function formatHotkeyBaked(hotkey: { modifiers: string[]; key: string }): string {
  const mods = platformizeModifiers(hotkey.modifiers || []).map(getBakedModifierLabel)
  const key = getBakedKeyLabel(hotkey.key || '')
  return [...mods, key].filter(Boolean).join(' + ')
}
