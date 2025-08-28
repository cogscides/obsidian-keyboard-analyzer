/**
 * Centralized builder for commandEntry objects.
 *
 * Exports buildCommandEntry(app, hotkeyManager, command)
 * Signature matches requested shape:
 *   buildCommandEntry(app: App, hotkeyManager: any, command: any): CommandEntry
 *
 * Implementation is defensive (runtime guards) to avoid breaking builds when
 * imported in different manager contexts. It reuses helpers from commandMeta.ts.
 */

import type { App, Command } from 'obsidian'
import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
import { platformizeModifiers, sortModifiers, normalizeKey } from './modifierUtils'
import { convertKeymapInfoToHotkey } from '../interfaces/Interfaces'
import { getPluginName, isInternalCommand } from './commandMeta'

export function buildCommandEntry(
  app: App,
  hotkeyManager: {
    getHotkeysForCommand: (id: string) => {
      all: hotkeyEntry[]
      default: hotkeyEntry[]
      custom: hotkeyEntry[]
    }
  },
  command: Command | { id: string; name?: string }
): commandEntry {
  const id = (command as { id: string }).id || ''
  const name = (command as { name?: string }).name || ''
  // Retrieve hotkeys from Obsidian's app.hotkeyManager to ensure live state
  let hotkeyResult: {
    all: hotkeyEntry[]
    default: hotkeyEntry[]
    custom: hotkeyEntry[]
  } = {
    all: [],
    default: [],
    custom: [],
  }
  try {
    const hm = (app as unknown as { hotkeyManager?: any }).hotkeyManager
    if (hm) {
      const defRaw = (hm.getDefaultHotkeys && hm.getDefaultHotkeys(id)) || []
      const cusRaw = (hm.customKeys && hm.customKeys[id]) || []
      const toEntry = (arr: any[], isCustom: boolean): hotkeyEntry[] =>
        (arr || []).map(info => ({ ...convertKeymapInfoToHotkey(info), isCustom }))
      const defaultEntries = toEntry(defRaw, false)
      const customEntries = toEntry(cusRaw, true)
      // De-dupe all by normalized signature (platformized, sorted modifiers + normalized key)
      const map = new Map<string, hotkeyEntry>()
      const push = (hk: hotkeyEntry) => {
        const mods = sortModifiers(
          platformizeModifiers((hk.modifiers as unknown as string[]) || [])
        )
        const sig = `${mods.join(',')}|${normalizeKey(hk.key || '')}`
        map.set(sig, hk)
      }
      defaultEntries.forEach(push)
      customEntries.forEach(push)
      hotkeyResult = {
        all: Array.from(map.values()),
        default: defaultEntries,
        custom: customEntries,
      }
    } else if (
      hotkeyManager &&
      typeof hotkeyManager.getHotkeysForCommand === 'function'
    ) {
      const res = hotkeyManager.getHotkeysForCommand(id)
      if (res && Array.isArray(res.all)) {
        hotkeyResult = {
          all: res.all,
          default: res.default || [],
          custom: res.custom || [],
        }
      }
    }
  } catch {
    // keep defaults
  }

  // pluginId and cmdName from id.split(':')
  const [pluginId, ...rest] = id.split(':')
  const cmdName = rest.join(':') || name

  // Determine plugin display name and internal flag with helpers
  let pluginName = pluginId || ''
  try {
    if (app) pluginName = getPluginName(app, pluginId)
  } catch {
    pluginName = pluginId
  }

  const isInternal = (() => {
    try {
      return isInternalCommand(app, id)
    } catch {
      // Fallback heuristic if helper fails
      if (!pluginId) return false
      return (
        pluginId === 'app' || pluginId === 'workspace' || pluginId === 'editor'
      )
    }
  })()

  // Ensure arrays are arrays and unique for 'all'
  const defaultHotkeys = Array.isArray(hotkeyResult.default)
    ? hotkeyResult.default
    : []
  const customHotkeys = Array.isArray(hotkeyResult.custom)
    ? hotkeyResult.custom
    : []
  const allHotkeys =
    Array.isArray(hotkeyResult.all) && hotkeyResult.all.length > 0
      ? hotkeyResult.all
      : // fallback: merge default + custom, de-dupe by normalized signature
        (() => {
          const map = new Map<string, hotkeyEntry>()
          const push = (hk: hotkeyEntry) => {
            const mods = sortModifiers(
              platformizeModifiers((hk.modifiers as unknown as string[]) || [])
            )
            const sig = `${mods.join(',')}|${normalizeKey(hk.key || '')}`
            map.set(sig, hk)
          }
          defaultHotkeys.forEach(push)
          customHotkeys.forEach(push)
          return Array.from(map.values())
        })()

  const entry: commandEntry = {
    id,
    name,
    hotkeys: allHotkeys,
    defaultHotkeys,
    customHotkeys,
    isInternalModule: isInternal,
    pluginName,
    cmdName,
  }

  return entry
}
