import type { Hotkey, App, HotKeyManager } from 'obsidian'
import { Platform } from 'obsidian'
import { getConvertedModifiers, areModifiersEqual } from './modifierUtils'
import type { hotkeyDict, hotkeyEntry } from '../interfaces/Interfaces'

export function getHotkeysV2(app: App): hotkeyDict {
  const hotKeyDict: hotkeyDict = {}
  const hkm: HotKeyManager = app.hotkeyManager

  for (const [id, command] of Object.entries(app.commands.commands)) {
    const isBuiltInCommand = command.name.split(':').length === 1
    const pluginName = isBuiltInCommand
      ? command.id.charAt(0).toUpperCase() + command.id.split(':')[0].slice(1)
      : command.name.split(':', 2)[0]
    const cmdName = isBuiltInCommand
      ? command.name
      : command.name.split(':').slice(1).join(':')
    const hotkeys: Hotkey[] = (hkm.getHotkeys(id) ||
      hkm.getDefaultHotkeys(id) ||
      []) as Hotkey[]

    function prepareHotkey(hotkey: Hotkey): hotkeyEntry {
      const hotkeyObj: hotkeyEntry = {
        key: hotkey.key,
        isCustom: isCustomizedHotkey(id, hotkey, app),
        modifiers: [],
      }
      if (hotkey.modifiers) {
        hotkeyObj.modifiers = hotkey.modifiers
        hotkeyObj.backedModifiers = getConvertedModifiers(
          hotkey.modifiers
        ).join(',')
      }
      return hotkeyObj
    }

    for (const hotkey of hotkeys) {
      const hotkeyObj = prepareHotkey(hotkey)
      if (!hotKeyDict[id]) {
        hotKeyDict[id] = {
          id,
          pluginName,
          cmdName,
          hotkeys: [hotkeyObj],
        }
      } else {
        hotKeyDict[id] = {
          id,
          pluginName,
          cmdName,
          hotkeys: [hotkeyObj] as hotkeyEntry[],
        }
      }
    }
  }
  return hotKeyDict
}

export function getCommandNameById(id: string, app: App): string {
  const cmd = app.commands.commands[id]
  return cmd ? cmd.name : ''
}

export function isCustomizedHotkey(
  id: string,
  hotkey: Hotkey,
  app: App
): boolean {
  const customKeys = app.hotkeyManager.customKeys[id]
  const defaultKeys = app.hotkeyManager.getDefaultHotkeys(id)

  if (customKeys) {
    for (const customHotkey of customKeys) {
      if (
        areModifiersEqual(customHotkey.modifiers, hotkey.modifiers) &&
        customHotkey.key === hotkey.key
      ) {
        return true
      }
    }
  }

  if (defaultKeys) {
    for (const defaultHotkey of defaultKeys) {
      if (
        areModifiersEqual(defaultHotkey.modifiers, hotkey.modifiers) &&
        defaultHotkey.key === hotkey.key
      ) {
        return false
      }
    }
  }

  return true
}

export function isHotkeyDuplicate(
  commandID: string,
  hotkey: Hotkey,
  app: App
): boolean {
  const commands = getHotkeysV2(app)
  for (const [currentCommandID, command] of Object.entries(commands)) {
    if (currentCommandID !== commandID) {
      for (const currentHotkey of command.hotkeys) {
        if (
          currentHotkey.key === hotkey.key &&
          areModifiersEqual(currentHotkey.modifiers, hotkey.modifiers)
        ) {
          return true
        }
      }
    }
  }
  return false
}

// ... (move other hotkey-related utility functions)
