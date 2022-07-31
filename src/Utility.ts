import type { Modifier, Hotkey } from 'obsidian'
// sort hotkey modifiers by 'Mod', 'Meta', 'Ctrl', 'Shift', 'Alt'
// modifiers is a string that is a comma separated list of modifiers
// e.g. 'Ctrl,Shift'
// modifiers need to be split into an array of strings (e.g. ['Ctrl', 'Shift'])
export function getSortedModifiers(modifiers: Modifier) {
  let sortedModifiers = modifiers.split(',')
  sortedModifiers.sort((a: string, b: string) => {
    if (a === 'Mod') {
      return -1
    }
    if (b === 'Mod') {
      return 1
    }
    if (a === 'Meta') {
      return -1
    }
    if (b === 'Meta') {
      return 1
    }
    if (a === 'Ctrl') {
      return -1
    }
    if (b === 'Ctrl') {
      return 1
    }
    if (a === 'Alt') {
      return -1
    }
    if (b === 'Alt') {
      return 1
    }
    if (a === 'Shift') {
      return -1
    }
    if (b === 'Shift') {
      return 1
    }
    return 0
  })
  return sortedModifiers
}
