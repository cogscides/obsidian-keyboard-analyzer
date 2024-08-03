// modifierUtils.ts

import { Platform } from 'obsidian'
import type { Modifier } from 'obsidian'

export type ModifierMap = { [key: string]: Modifier }

export type ModifierKey = 'Control' | 'Shift' | 'Alt' | 'Meta' | 'Mod'

export const modifierMap: Record<ModifierKey, Modifier> = {
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Meta: 'Meta',
  Mod: Platform.isMacOS ? 'Meta' : 'Ctrl',
}

export const displayModifierMap: Record<ModifierKey, string> = {
  Control: Platform.isMacOS ? 'Ctrl' : 'Control',
  Shift: 'Shift',
  Alt: Platform.isMacOS ? 'Option' : 'Alt',
  Meta: Platform.isMacOS ? 'Cmd' : 'Meta',
  Mod: Platform.isMacOS ? 'Cmd' : 'Ctrl',
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

export function unconvertModifiers(modifiers: Modifier[]): string[] {
  return modifiers.map(unconvertModifier)
}

export function getDisplayModifiers(modifiers: string[]): string[] {
  return modifiers.map(getDisplayModifier)
}

export function sortModifiers(modifiers: string[]): string[] {
  const order = Platform.isMacOS
    ? ['Ctrl', 'Alt', 'Shift', 'Cmd']
    : ['Ctrl', 'Alt', 'Shift', 'Win']

  return modifiers.sort((a, b) => {
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
  const sorted1 = sortModifiers(modifiers1)
  const sorted2 = sortModifiers(modifiers2)
  return (
    sorted1.length === sorted2.length &&
    sorted1.every((modifier, index) => modifier === sorted2[index])
  )
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
