import type { Command, Hotkey, Modifier, App } from 'obsidian'
import type { EntryType } from 'perf_hooks'
import type { hotkeyDict } from 'src/Interfaces'

export function getHotkeysV2(app: App) {
  app.hotkeyManager.bake()

  let hotKeyDict: hotkeyDict = {}
  app.hotkeyManager.bakedIds.forEach((id: string, i: number) => {
    if (getCommandNameById(id, app) !== '') {
      if (hotKeyDict[id]) {
        hotKeyDict[id].push(app.hotkeyManager.bakedHotkeys[i])
        console.log(hotKeyDict[id])
      } else {
        hotKeyDict[id] = [app.hotkeyManager.bakedHotkeys[i]]
      }
    }
  })

  // console.log(hotKeyDict)
  return hotKeyDict
}

export function getCommandNameById(id: string, app: App) {
  let cmd = app.commands.commands[id]
  if (cmd) {
    return cmd.name
  }
  return ''
}

// check if hotkey is Customized
// app.hotkeyManager.customKeys store all custom hotkeys
// if reassigned return true
// https://forum.obsidian.md/t/dataviewjs-snippet-showcase/17847/37
export function isCustomizedHotkey(
  id: string,
  { modifiers, key }: { modifiers: string; key: string },
  app: App
) {
  let customizedHotkeys: { modifiers: string[]; key: string }[] | undefined =
    app.hotkeyManager.customKeys[id]
  if (customizedHotkeys) {
    console.log(id)

    for (let hotkey of customizedHotkeys) {
      // prepare customHotkey modifiers
      let osModifiers = getConvertedModifiers(hotkey.modifiers)
      let sortedModifiers = sortModifiers(osModifiers)
      let customHotkeyModifiersString = sortedModifiers.join(',')

      // prepare inputed modifiers
      let inputModifiers = sortModifiers(
        unbakeModifiersToArray(modifiers)
      ).join(',')

      if (
        customHotkeyModifiersString !== inputModifiers ||
        hotkey.key !== key
      ) {
        return false
      }
    }
    return true

    // console.log(customizedHotkeys)
  } else if (customizedHotkeys === undefined) {
    return false
  }
}
// function isCustomHotkey(name: string, hotkey: string) {
//   let customHotkeysFound: Hotkey[] = customKeys[name] // if customId exists

//   if (customHotkeysFound) {
//     for (let customHotkey of customHotkeysFound) {
//       // check if hotkey.modifiers is equal to customHotkey.modifiers
//       // use convertModifier() to convert modifiers to OS specific modifiers
//       if (
//         getConvertedModifiers(hotkey.modifiers).join(',') ===
//           getSortedModifiers(customHotkey.modifiers.join(',')).join(',') &&
//         hotkey.key === customHotkey.key
//       ) {
//         console.log(hotkey, 'equal to', customHotkey)
//         return true
//       } else {
//         return false
//       }
//     }
//   }
//   return false
//   // console.log(name, ':', hotkey, ':', customHotkey)
// }

// ^^^^^^
// MODIFIERS
// ^^^^^^

// convert modifier to OS specific modifier, check which OS is running
// e.g. 'Mod' -> 'Ctrl' on Windows, 'Cmd' on Mac
// Mod = Cmd on MacOS and Ctrl on other OS
// Ctrl = Ctrl key for every OS
// Meta = Cmd on MacOS and Win key on other OS
export function getConvertedModifiers(modifiers: string[]) {
  let convertedModifiers = modifiers.map((modifier: Modifier) => {
    if (modifier === 'Mod') {
      // check macos
      if (process.platform === 'darwin') {
        return 'Cmd'
      } else {
        return 'Ctrl'
      }
    }
    if (modifier === 'Meta') {
      // check macos
      if (process.platform === 'darwin') {
        return 'Cmd'
      } else {
        return 'Win'
      }
    }
    return modifier
  })
  return convertedModifiers
}

// sort modifiers
export function sortModifiers(modifiers: string[]) {
  let sortedModifiers = modifiers.sort((a: String, b: String) => {
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
  })
  return sortedModifiers
}

// bake Hotkey.modifiers to string
export function bakeModifierToString(
  modifiers: string[],
  sort: boolean = true
) {
  if (sort) {
    modifiers = sortModifiers(modifiers)
  }
  let bakedModifiers: string = modifiers
    .map((modifier: Modifier) => {
      let bakedModifier = getConvertedModifiers([modifier])[0]
      return bakedModifier
    })
    .join(' + ')

  return bakedModifiers
}

// function to convert string modifiers to array of modifiers
export function unbakeModifiersToArray(
  modifiers: string,
  delimiter: string = ','
) {
  let modifiersArray: Modifier[] = modifiers.split(delimiter) as Modifier[]
  return modifiersArray
}

//  prepare modifiers to display in the UI: sort, convert to OS specific
export function prepareModifiersString(modifiers: string) {
  if (modifiers === '') {
    return ''
  } else {
    return sortModifiers(unbakeModifiersToArray(modifiers)).join(' + ') + ' + '
  }
}
