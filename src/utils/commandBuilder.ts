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
import type { hotkeyEntry, commandEntry } from '../interfaces/Interfaces'
import { getPluginName, isInternalCommand } from './commandMeta'

export function buildCommandEntry(
  app: App,
  hotkeyManager:
    | {
        getHotkeysForCommand: (id: string) => {
          all: hotkeyEntry[]
          default: hotkeyEntry[]
          custom: hotkeyEntry[]
        }
      }
    | any,
  command: Command | { id: string; name?: string }
): commandEntry {
  const id = (command as any).id || ''
  const name = (command as any).name || ''
  // Retrieve hotkeys safely
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
    // Prefer authoritative CommandsManager index when available (defensive require)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const CommandsManagerModule = require('../managers/commandsManager/commandsManager.svelte.ts')
      const CommandsManagerClass = CommandsManagerModule.default
      if (
        CommandsManagerClass &&
        typeof CommandsManagerClass.getInstance === 'function'
      ) {
        const cm = CommandsManagerClass.getInstance(app, undefined)
        if (cm && typeof cm.getCommandsIndex === 'function') {
          const index = cm.getCommandsIndex() as Record<string, any>
          const entry = index[id]
          if (entry && Array.isArray(entry.hotkeys) && entry.hotkeys.length > 0) {
            hotkeyResult = {
              all: entry.hotkeys,
              default: entry.defaultHotkeys || [],
              custom: entry.customHotkeys || [],
            }
          }
        }
      }
    } catch {
      // ignore and fall through to hotkeyManager-based retrieval
    }
  
    // Prefer the authoritative CommandsManager-backed hotkeys when present (handled above).
    // Otherwise use the modern hotkeyManager.getHotkeysForCommand API if available.
    if (
      hotkeyManager &&
      typeof hotkeyManager.getHotkeysForCommand === 'function'
    ) {
      hotkeyResult = hotkeyManager.getHotkeysForCommand(id) || hotkeyResult
    } else if (
      // Legacy fallback: some older managers expose getAllHotkeysForCommand(id)
      typeof (hotkeyManager as any).getAllHotkeysForCommand === 'function'
    ) {
      const all = (hotkeyManager as any).getAllHotkeysForCommand(id) || []
      hotkeyResult = { all, default: [], custom: [] }
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
      return isInternalCommand((app as App)!, id)
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
      : // fallback: merge default + custom, de-dupe by key+modifiers
        (() => {
          const map = new Map<string, hotkeyEntry>()
          const push = (hk: hotkeyEntry) => {
            const key = `${(hk.modifiers || []).slice().sort().join(',')}|${
              hk.key || ''
            }`
            map.set(key, hk)
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
