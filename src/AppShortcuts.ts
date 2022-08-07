import type { Command, Hotkey, Modifier, App } from 'obsidian'
import type { EntryType } from 'perf_hooks'
import type { hotkeyDict, hotkeyEntry } from 'src/Interfaces'

export function getHotkeysV2(app: App) {
  // app.hotkeyManager.bake()
  let hotKeyDict: hotkeyDict = {} as hotkeyDict

  const hkm = app.hotkeyManager

  Object.entries(app.commands.commands).forEach(([id, command]) => {
    let isBuiltInCommand = command.name.split(':').length === 1
    let pluginName: string = isBuiltInCommand
      ? command.id.charAt(0).toUpperCase() + command.id.split(':')[0].slice(1)
      : command.name.split(':', 2)[0]
    let cmdName: string = isBuiltInCommand
      ? command.name
      : command.name.split(':', 2)[1].trim()
    let hotkeys: Hotkey[] = (hkm.getHotkeys(command.id) ||
      hkm.getDefaultHotkeys(command.id) ||
      []) as Hotkey[]

    // function to prepare hotkey object
    function prepareHotkey(hotkey: Hotkey) {
      let hotkeyObj: hotkeyEntry = {} as hotkeyEntry
      if (hotkey.modifiers) {
        hotkeyObj.modifiers = hotkey.modifiers
        hotkeyObj.backedModifiers = getConvertedModifiers(
          hotkey.modifiers
        ).join(',')
      }
      hotkeyObj.key = hotkey.key
      hotkeyObj.isCustom = isCustomizedHotkey(id, hotkey, app)

      return hotkeyObj
    }

    // assign hotkey to hotkeyDict
    hotkeys.forEach((hotkey) => {
      let hotkeyObj = prepareHotkey(hotkey)
      if (!hotKeyDict[id]) {
        hotKeyDict[id] = {
          id,
          pluginName,
          cmdName,
          hotkeys: [hotkeyObj],
        }
      } else {
        hotKeyDict[id].hotkeys.push(hotkeyObj)
      }
    })
  })

  console.log(hotKeyDict)
  return hotKeyDict
}

export function getCommandNameById(id: string, app: App) {
  let cmd = app.commands.commands[id]
  if (cmd) {
    return cmd.name as string
  }
  return ''
}

// check if hotkey is Customized
// app.hotkeyManager.customKeys store all custom hotkeys
// if reassigned return true
// https://forum.obsidian.md/t/dataviewjs-snippet-showcase/17847/37
export function isCustomizedHotkey(id: string, hotkey: Hotkey, app: App) {
  let isCustom: boolean = false
  let customKeys = app.hotkeyManager.customKeys[id]
  let defaultKeys = app.hotkeyManager.getDefaultHotkeys(id)

  if (id === 'editor:save-file') {
    console.log(id, defaultKeys)
  }
  if (customKeys) {
    // if command found in customKeys, check if hotkey is customized
    // for each hotkey in customKeys, check if it is customized
    for (let customHotkey of customKeys) {
      // compare arrays of modifiers, all modifiers must be the same
      if (
        customHotkey.modifiers.length === hotkey.modifiers.length &&
        customHotkey.modifiers.every((modifier, index) => {
          return modifier === hotkey.modifiers[index]
        }) &&
        customHotkey.key === hotkey.key
      ) {
        isCustom = true
      } else {
        isCustom = false
      }
    }
  }

  // check if hotkey is default
  if (defaultKeys !== undefined) {
    for (let defaultHotkey of defaultKeys) {
      if (
        defaultHotkey.modifiers.length === hotkey.modifiers.length &&
        defaultHotkey.modifiers.every((modifier, index) => {
          return modifier === hotkey.modifiers[index]
        }) &&
        defaultHotkey.key === hotkey.key
      ) {
        isCustom = false
      } else {
        isCustom = true
      }
    }
  } else if (defaultKeys === undefined) {
    isCustom = true
  }
  return isCustom
}

// check if hotkey is Customized
// app.hotkeyManager.customKeys store all custom hotkeys
// if reassigned return true
// https://forum.obsidian.md/t/dataviewjs-snippet-showcase/17847/37
// export function isCustomizedHotkey(
//   id: string,
//   { modifiers, key }: { modifiers: Modifier[]; key: string } | Hotkey,
//   app: App
// ) {
//   let customizedHotkeys: { modifiers: string[]; key: string }[] | undefined | Hotkey =
//     app.hotkeyManager.customKeys[id]
//   if (customizedHotkeys) {
//     console.log(id)

//     for (let hotkey of customizedHotkeys) {
//       // prepare customHotkey modifiers
//       let osModifiers = getConvertedModifiers(hotkey.modifiers)
//       let sortedModifiers = sortModifiers(osModifiers)
//       let customHotkeyModifiersString = sortedModifiers.join(',')

//       // prepare inputed modifiers
//       let inputModifiers = sortModifiers(
//         unbakeModifiersToArray(modifiers)
//       ).join(',')

//       if (
//         customHotkeyModifiersString !== inputModifiers ||
//         hotkey.key !== key
//       ) {
//         return false
//       }
//     }
//     return true

//     // console.log(customizedHotkeys)
//   } else if (customizedHotkeys === undefined) {
//     return false
//   }
// }

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
export function getConvertedModifiers(modifiers: Modifier[]) {
  // console.log(modifiers)

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
  return convertedModifiers as string[]
}

// unconvert modifier to OS specific modifier, check which OS is running
// e.g. 'Ctrl' -> 'Mod' on Windows, 'Cmd' on Mac
// Mod = Cmd on MacOS and Ctrl on other OS
// Ctrl = Ctrl key for every OS
// Meta = Cmd on MacOS and Win key on other OS
export function getUnconvertedModifiers(modifiers: Modifier[]) {
  let unconvertedModifiers: Modifier[] = modifiers.map((modifier: string) => {
    if (modifier === 'Ctrl') {
      return 'Ctrl'
    }
    if (modifier === 'Cmd' && process.platform === 'darwin') {
      return 'Mod'
    }
    if (modifier === 'Win') {
      return 'Meta'
    }
    if (modifier === 'Cmd' && process.platform === 'darwin') {
      return 'Meta'
    }
  })
  return unconvertedModifiers as string[]
}

// sort modifiers
export function sortModifiers(modifiers: Modifier[] | string[]) {
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
  return sortedModifiers as Modifier[]
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
export function prepareModifiersString(modifiers: string[]) {
  if (modifiers.length) {
    return ''
  } else {
    return getConvertedModifiers(sortModifiers(modifiers)).join(' + ') + ' + '
  }
}
