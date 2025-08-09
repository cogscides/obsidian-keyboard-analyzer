import type { Modifier } from 'obsidian'
import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'

function isMac(): boolean {
  // Electron/Node provides process.platform in Obsidian
  // Fallback to navigator for safety
  try {
    // @ts-ignore
    return typeof process !== 'undefined' && process.platform === 'darwin'
  } catch {
    return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  }
}

function isWindows(): boolean {
  try {
    // @ts-ignore
    return typeof process !== 'undefined' && process.platform === 'win32'
  } catch {
    return typeof navigator !== 'undefined' && /Win/.test(navigator.platform)
  }
}

function isLinux(): boolean {
  try {
    // @ts-ignore
    return typeof process !== 'undefined' && process.platform === 'linux'
  } catch {
    return typeof navigator !== 'undefined' && /Linux/.test(navigator.platform)
  }
}

function hk(mods: Modifier[] | string[], key: string): hotkeyEntry {
  return {
    modifiers: mods as Modifier[],
    key,
    isCustom: false,
  }
}

export function getSystemShortcutCommands(): commandEntry[] {
  const items: commandEntry[] = []
  const pluginName = 'System Shortcuts'

  // Cross-platform using Mod where appropriate
  const common: { id: string; name: string; hotkeys: hotkeyEntry[] }[] = [
    { id: 'system:undo', name: 'Undo', hotkeys: [hk(['Mod'], 'z')] },
    // Redo: macOS commonly uses Shift+Cmd+Z, Windows/Linux often Ctrl+Y
    { id: 'system:redo', name: 'Redo', hotkeys: isMac() ? [hk(['Mod', 'Shift'], 'z')] : [hk(['Control'], 'y')] },
    { id: 'system:cut', name: 'Cut', hotkeys: [hk(['Mod'], 'x')] },
    { id: 'system:copy', name: 'Copy', hotkeys: [hk(['Mod'], 'c')] },
    { id: 'system:paste', name: 'Paste', hotkeys: [hk(['Mod'], 'v')] },
    // Zoom controls
    { id: 'system:zoom-in', name: 'Zoom In', hotkeys: [hk(['Mod'], '=')] },
    { id: 'system:zoom-out', name: 'Zoom Out', hotkeys: [hk(['Mod'], '-')] },
    { id: 'system:zoom-reset', name: 'Reset Zoom', hotkeys: [hk(['Mod'], '0')] },
  ]

  for (const c of common) {
    items.push({
      id: c.id,
      name: c.name,
      hotkeys: c.hotkeys,
      defaultHotkeys: c.hotkeys,
      customHotkeys: [],
      isInternalModule: false,
      pluginName,
      cmdName: c.name,
    })
  }

  // Windows/Linux specifics (Insert, selection with arrows, etc.)
  if (isWindows() || isLinux()) {
    const winLin: { id: string; name: string; hotkeys: hotkeyEntry[] }[] = [
      { id: 'system:copy-insert', name: 'Copy (Ctrl+Insert)', hotkeys: [hk(['Control'], 'Insert')] },
      { id: 'system:paste-shift-insert', name: 'Paste (Shift+Insert)', hotkeys: [hk(['Shift'], 'Insert')] },
      { id: 'system:cut-shift-delete', name: 'Cut (Shift+Delete)', hotkeys: [hk(['Shift'], 'Delete')] },
      // Selection / navigation examples
      { id: 'system:select-char-left', name: 'Select Left', hotkeys: [hk(['Shift'], 'ArrowLeft')] },
      { id: 'system:select-word-left', name: 'Select Word Left', hotkeys: [hk(['Control', 'Shift'], 'ArrowLeft')] },
      { id: 'system:select-word-right', name: 'Select Word Right', hotkeys: [hk(['Control', 'Shift'], 'ArrowRight')] },
    ]
    for (const c of winLin) {
      items.push({
        id: c.id,
        name: c.name,
        hotkeys: c.hotkeys,
        defaultHotkeys: c.hotkeys,
        customHotkeys: [],
        isInternalModule: false,
        pluginName,
        cmdName: c.name,
      })
    }
  }

  // macOS specifics (Option word navigation)
  if (isMac()) {
    const mac: { id: string; name: string; hotkeys: hotkeyEntry[] }[] = [
      { id: 'system:move-word-left', name: 'Move Word Left', hotkeys: [hk(['Alt'], 'ArrowLeft')] },
      { id: 'system:select-word-left-mac', name: 'Select Word Left', hotkeys: [hk(['Alt', 'Shift'], 'ArrowLeft')] },
      { id: 'system:select-word-right-mac', name: 'Select Word Right', hotkeys: [hk(['Alt', 'Shift'], 'ArrowRight')] },
    ]
    for (const c of mac) {
      items.push({
        id: c.id,
        name: c.name,
        hotkeys: c.hotkeys,
        defaultHotkeys: c.hotkeys,
        customHotkeys: [],
        isInternalModule: false,
        pluginName,
        cmdName: c.name,
      })
    }
  }

  return items
}

