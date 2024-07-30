// src/utils/modifierUtils.ts

import { Platform } from 'obsidian'
import type { Modifier } from 'obsidian'

export function getRecognizedModifiers(): Set<string> {
  const commonModifiers = new Set(['Shift', 'Alt', 'Ctrl'])
  if (Platform.isMacOS) {
    commonModifiers.add('Cmd')
  } else {
    commonModifiers.add('Win')
  }
  return commonModifiers
}

export function getConvertedModifiers(modifiers: Modifier[]): Modifier[] {
  return modifiers.map((modifier: Modifier): Modifier => {
    if (modifier === 'Mod') {
      return Platform.isMacOS ? 'Meta' : 'Ctrl'
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

export function convertKeyToOS(key: string): string {
  switch (key) {
    case 'Control':
      return 'Ctrl'
    case 'Meta':
      return Platform.isMacOS ? 'Cmd' : 'Win'
    case 'Mod':
      return Platform.isMacOS ? 'Cmd' : 'Ctrl'
    default:
      return key
  }
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

export function areModifiersEqual(
  modifiers1: Modifier[] | undefined,
  modifiers2: Modifier[] | undefined
): boolean {
  if (!modifiers1 || !modifiers2) return modifiers1 === modifiers2
  return (
    modifiers1.length === modifiers2.length &&
    modifiers1.every((modifier, index) => modifier === modifiers2[index])
  )
}
