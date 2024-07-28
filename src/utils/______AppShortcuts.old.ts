import type { Hotkey, Modifier, App } from 'obsidian'
import { Platform } from 'obsidian'
import type { hotkeyDict, hotkeyEntry } from '../interfaces/Interfaces'

export function getConvertedModifiers(modifiers: Modifier[]): string[] {
  return modifiers.map((modifier: Modifier) => {
    if (modifier === 'Mod') {
      return Platform.isMacOS ? 'Cmd' : 'Ctrl'
    }
    if (modifier === 'Meta') {
      return Platform.isMacOS ? 'Cmd' : 'Win'
    }
    return modifier
  })
}

export function getUnconvertedModifiers(modifiers: string[]): Modifier[] {
  return modifiers
    .map((modifier: string): Modifier | undefined => {
      if (modifier === 'Ctrl') return 'Ctrl'
      if (modifier === 'Cmd' && Platform.isMacOS) return 'Mod'
      if (modifier === 'Win') return 'Meta'
      if (modifier === 'Cmd' && Platform.isMacOS) return 'Meta'
      if (modifier === 'Shift' || modifier === 'Alt') return modifier
      return undefined
    })
    .filter((modifier): modifier is Modifier => modifier !== undefined)
}

export function sortModifiers(modifiers: Modifier[] | string[]): Modifier[] {
  return modifiers.sort((a: string, b: string) => {
    if (a === 'Mod') return -1
    if (b === 'Mod') return 1
    if (a === 'Meta') return -1
    if (b === 'Meta') return 1
    return a.localeCompare(b)
  }) as Modifier[]
}

export function bakeModifierToString(modifiers: string[], sort = true): string {
  let sortedModifiers = modifiers
  if (sort) {
    sortedModifiers = sortModifiers(sortedModifiers)
  }
  return sortedModifiers
    .map((modifier: string) => getConvertedModifiers([modifier as Modifier])[0])
    .join(' + ')
}

export function unbakeModifiersToArray(
  modifiers: string,
  delimiter = ','
): Modifier[] {
  return modifiers.split(delimiter) as Modifier[]
}

export function prepareModifiersString(modifiers: string[]): string {
  if (modifiers.length === 0) {
    return ''
  }
  return `${getConvertedModifiers(sortModifiers(modifiers)).join(' + ')} + `
}

function areModifiersEqual(
  modifiers1: Modifier[] | undefined,
  modifiers2: Modifier[] | undefined
): boolean {
  if (!modifiers1 || !modifiers2) return modifiers1 === modifiers2
  return (
    modifiers1.length === modifiers2.length &&
    modifiers1.every((modifier, index) => modifier === modifiers2[index])
  )
}
