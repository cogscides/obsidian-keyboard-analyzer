import type { Command, Hotkey, Modifier, App } from 'obsidian'
import { Platform } from 'obsidian'
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
      : // split by ":" remove the first element (plugin name) and join with ":"
        command.name.split(':').slice(1).join(':')
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

  if (customKeys) {
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

// return true if hotkey duplicated with other hotkey
export function isHotkeyDuplicate(commandID: string, hotkey: Hotkey, app: App) {
  let isDuplicate = false
  let commands = getHotkeysV2(app)
  for (let command of Object.entries(commands)) {
    let currentCommandID = command[0]
    let currentHotkeys = command[1].hotkeys

    if (currentCommandID !== commandID) {
      for (let currentHotkey of currentHotkeys) {
        if (
          currentHotkey.key === hotkey.key &&
          currentHotkey.modifiers.length === hotkey.modifiers.length &&
          currentHotkey.modifiers.every((modifier, index) => {
            return modifier === hotkey.modifiers[index]
          })
        ) {
          isDuplicate = true
        }
      }
    }
  }

  return isDuplicate
}

export function getConvertedModifiers(modifiers: Modifier[]) {
  let convertedModifiers = modifiers.map((modifier: Modifier) => {
    if (modifier === 'Mod') {
      // check macos
      if (Platform.isMacOS === true) {
        return 'Cmd'
      } else {
        return 'Ctrl'
      }
    }
    if (modifier === 'Meta') {
      // check macos
      if (Platform.isMacOS === true) {
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
    if (modifier === 'Cmd' && Platform.isMacOS === true) {
      return 'Mod'
    }
    if (modifier === 'Win') {
      return 'Meta'
    }
    if (modifier === 'Cmd' && Platform.isMacOS === true) {
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
