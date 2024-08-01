import { Platform } from 'obsidian'
import type { Modifier } from 'obsidian'

/** Mapping of modifier keys to their standardized Obsidian representation */
export type ModifierMap = { [key: string]: Modifier }

/**
 * Mapping of modifier keys to their standardized Obsidian representation,
 * taking into account the current platform (macOS or other).
 * Exported for use in other modules.
 * { [key: string]: Modifier }
 * Example:
 * { Ctrl: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Cmd: 'Mod', Win: 'Meta', Mod: 'Ctrl' }
 */
export const modifierMap: ModifierMap = {
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Cmd: Platform.isMacOS ? 'Mod' : 'Meta',
  Win: 'Meta',
  Mod: Platform.isMacOS ? 'Meta' : 'Ctrl',
}

/**
 * Returns information about recognized and converted modifiers.
 * @returns An object containing a Set of recognized modifiers and a ModifierMap of converted modifiers.
 */
export function getModifierInfo(): {
  recognized: Set<string>
  converted: ModifierMap
} {
  const recognized = new Set([
    'Shift',
    'Alt',
    'Ctrl',
    ...(Platform.isMacOS ? ['Cmd'] : ['Win']),
  ])
  return { recognized, converted: modifierMap }
}

/**
 * Converts an array of modifiers to their standardized Obsidian representation.
 * @param modifiers - An array of Modifier keys to convert.
 * @returns An array of converted Modifier keys.
 */
export function convertModifiers(modifiers: Modifier[]): Modifier[] {
  return modifiers.map((modifier) => modifierMap[modifier] || modifier)
}

/**
 * Converts an array of modifier strings back to their original representation.
 * @param modifiers - An array of modifier strings to unconvert.
 * @returns An array of unconverted Modifier keys.
 */
export function unconvertModifiers(modifiers: string[]): Modifier[] {
  return modifiers
    .map(
      (modifier) =>
        Object.entries(modifierMap).find(
          ([_, value]) => value === modifier
        )?.[0] as Modifier | undefined
    )
    .filter((modifier): modifier is Modifier => modifier !== undefined)
}

/**
 * Converts a key to its OS-specific representation.
 * @param key - The key to convert.
 * @returns The OS-specific representation of the key.
 */
export function convertKeyToOS(key: string): string {
  return modifierMap[key] || key
}

/**
 * Sorts an array of modifiers based on a predefined order.
 * @param modifiers - An array of Modifier keys to sort.
 * @returns A sorted array of Modifier keys.
 */
export function sortModifiers(modifiers: Modifier[]): Modifier[] {
  const order = Platform.isMacOS
    ? ['Ctrl', 'Alt', 'Shift', 'Cmd']
    : ['Ctrl', 'Alt', 'Shift', 'Win']

  return modifiers.sort((a, b) => {
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

/**
 * Converts an array of modifiers to a string representation.
 * @param modifiers - An array of Modifier keys to convert.
 * @param sort - Whether to sort the modifiers before converting (default: true).
 * @returns A string representation of the modifiers.
 */
export function modifiersToString(modifiers: Modifier[], sort = true): string {
  const mods = sort ? sortModifiers(modifiers) : modifiers
  return mods.map(convertKeyToOS).join(' + ')
}

/**
 * Converts a string of modifiers to an array of Modifier keys.
 * @param modifiers - A string of modifiers to convert.
 * @param delimiter - The delimiter used to separate modifiers in the string (default: ',').
 * @returns An array of Modifier keys.
 */
export function stringToModifiers(
  modifiers: string,
  delimiter = ','
): Modifier[] {
  return modifiers.split(delimiter) as Modifier[]
}

/**
 * Prepares a string representation of modifiers for display.
 * @param modifiers - An array of Modifier keys to prepare.
 * @returns A string representation of the modifiers, followed by ' + ' if not empty.
 */
export function prepareModifiersString(modifiers: Modifier[]): string {
  return modifiers.length ? `${modifiersToString(modifiers)} + ` : ''
}

/**
 * Compares two arrays of modifiers for equality.
 * @param modifiers1 - The first array of Modifier keys to compare.
 * @param modifiers2 - The second array of Modifier keys to compare.
 * @returns True if the arrays are equal, false otherwise.
 */
export function areModifiersEqual(
  modifiers1?: Modifier[],
  modifiers2?: Modifier[]
): boolean {
  if (!modifiers1 || !modifiers2) return modifiers1 === modifiers2
  return (
    modifiers1.length === modifiers2.length &&
    modifiers1.every((modifier, index) => modifier === modifiers2[index])
  )
}
