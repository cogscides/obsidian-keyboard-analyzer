// modifierUtils.ts

import { Platform } from 'obsidian'
import { getEmulatedOS } from './runtimeConfig'
import type { Modifier } from 'obsidian'

export type ModifierMap = { [key: string]: Modifier }

export type ModifierKey = 'Control' | 'Shift' | 'Alt' | 'Meta' | 'Mod'

function isMac(): boolean {
  const emu = getEmulatedOS()
  if (emu === 'macos') return true
  if (emu === 'windows' || emu === 'linux') return false
  return Platform.isMacOS
}

export const modifierMap: Record<ModifierKey, Modifier> = {
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Meta: 'Meta',
  Mod: isMac() ? 'Meta' : 'Ctrl',
}

export const displayModifierMap: Record<ModifierKey, string> = {
  Control: isMac() ? '⌃' : 'Control',
  Shift: '⇧',
  Alt: isMac() ? '⌥' : 'Alt',
  Meta: isMac() ? '⌘' : 'Meta',
  Mod: isMac() ? '⌘' : 'Ctrl',
}

// export function getModifierInfo(): {
//   recognized: Set<string>
//   converted: ModifierMap
// } {
//   const recognized = new Set([
//     'Shift',
//     'Alt',
//     'Ctrl',
//     ...(Platform.isMacOS ? ['Cmd'] : ['Win']),
//   ])
//   return { recognized, converted: modifierMap }
// }

export function convertModifier(modifier: string): Modifier {
  return (modifierMap[modifier as ModifierKey] || modifier) as Modifier
}

export function getDisplayModifier(modifier: string): string {
  return displayModifierMap[modifier as ModifierKey] || modifier
}

export function unconvertModifier(modifier: Modifier): string {
  const entry = Object.entries(modifierMap).find(
    ([_, value]) => value === modifier
  )
  return entry ? entry[0] : modifier
}

export function convertModifiers(modifiers: string[]): Modifier[] {
  return modifiers.map(convertModifier)
}

// Canonicalize modifiers for the current OS (emulation-aware)
// - On macOS: keep Meta; on Windows/Linux: treat Meta/Cmd as Ctrl; Option→Alt.
export function platformizeModifier(mod: string): Modifier {
  const m = String(mod)
  if (isMac()) {
    if (m === 'Mod') return 'Meta'
    if (m === 'Control' || m === 'Ctrl') return 'Ctrl'
    if (m === 'Alt' || m === 'Option') return 'Alt'
    if (m === 'Meta' || m === 'Cmd' || m === 'Win') return 'Meta'
    if (m === 'Shift') return 'Shift'
    return (m as Modifier)
  }
  // Windows/Linux
  if (m === 'Mod') return 'Ctrl'
  if (m === 'Meta' || m === 'Cmd') return 'Ctrl'
  if (m === 'Option') return 'Alt'
  if (m === 'Control') return 'Ctrl'
  if (m === 'Win') return 'Meta' // keep distinct bucket name if needed
  return (m as Modifier)
}

export function platformizeModifiers(mods: string[] | Modifier[]): Modifier[] {
  return (mods as string[]).map(platformizeModifier)
}

export function unconvertModifiers(modifiers: Modifier[]): string[] {
  return modifiers.map(unconvertModifier)
}

export function getDisplayModifiers(modifiers: string[]): string[] {
  return modifiers.map(getDisplayModifier)
}

export function sortModifiers(modifiers: string[]): string[] {
  const order = isMac()
    ? ['Ctrl', 'Alt', 'Shift', 'Cmd']
    : ['Ctrl', 'Alt', 'Shift', 'Win']

  return [...modifiers].sort((a, b) => {
    const indexA = order.indexOf(convertModifier(a))
    const indexB = order.indexOf(convertModifier(b))
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

export function modifiersToString(modifiers: string[], sort = true): string {
  const mods = sort ? sortModifiers(modifiers) : modifiers
  return mods.map(convertModifier).join(' + ')
}

export function stringToModifiers(
  modifiers: string,
  delimiter = ','
): string[] {
  return modifiers.split(delimiter)
}

export function prepareModifiersString(modifiers: string[]): string {
  return modifiers.length ? `${modifiersToString(modifiers)} + ` : ''
}

export function areModifiersEqual(
  modifiers1?: string[],
  modifiers2?: string[]
): boolean {
  if (!modifiers1 || !modifiers2) return modifiers1 === modifiers2
  if (modifiers1.length !== modifiers2.length) return false

  const set1 = new Set(modifiers1)
  for (const modifier of modifiers2) {
    if (!set1.has(modifier)) {
      return false
    }
  }

  return true
}

export function normalizeKey(key: string): string {
  // Handle both key codes and key labels
  let n_key = key.toLowerCase()
  // Map common key codes to their corresponding key labels
  const keyMap: { [n_key: string]: string } = {
    space: ' ',
    minus: '-',
    equal: '=',
    bracket: '[',
    bracketright: ']',
    semicolon: ';',
    quote: "'",
    backquote: '`',
    comma: ',',
    period: '.',
    slash: '/',
    backslash: '\\',
  }
  return keyMap[n_key] || n_key.replace('key', '').replace('digit', '')
}

export function isKeyMatch(activeKey: string, hotkeyKey: string): boolean {
  return normalizeKey(activeKey) === normalizeKey(hotkeyKey)
}
