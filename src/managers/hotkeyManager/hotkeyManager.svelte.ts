import type { App, Hotkey, KeymapInfo, Modifier } from 'obsidian'
import type { commandEntry, hotkeyEntry } from '../../interfaces/Interfaces'
import logger from '../../utils/logger'
import {
  matchHotkey,
  platformizeModifiers,
  sortModifiers,
} from '../../utils/modifierUtils'

import CommandsManager from '../commandsManager'

export default class HotkeyManager {
  private static instance: HotkeyManager | null = null
  private app: App
  // HotkeyManager no longer holds a local commands mirror; lookups should query
  // the authoritative CommandsManager.getCommandsIndex() when available and
  // fall back to building entries from app.commands when necessary.
  // When command data is required we will attempt to query CommandsManager's authoritative index.
  private cmRef: CommandsManager | undefined = undefined
  private constructor(app: App) {
    this.app = app
  }

  /**
   * Called by plugin/main to wire the authoritative CommandsManager instance.
   */
  public attachCommandsManager(cm: CommandsManager) {
    this.cmRef = cm
  }

  static getInstance(app: App): HotkeyManager {
    if (!HotkeyManager.instance) {
      HotkeyManager.instance = new HotkeyManager(app)
    }
    return HotkeyManager.instance
  }

  public async initialize() {
    // No local cache to populate. Consumers should query CommandsManager.getCommandsIndex().
    // Keep initialize async in case future hotkey-related init is needed.
    return
  }

  /**
   * Helper to return the authoritative commands index.
   * Falls back to computing a local index only if CommandsManager is not available
   * (defensive for initialization order).
   */
  private getCommandsIndex(): Record<string, commandEntry> {
    if (this.cmRef) return this.cmRef.getCommandsIndex()
    // No fallback: return empty until CommandsManager is available
    return {}
  }

  // Duplicated metadata helpers removed; use centralized utils in commandBuilder.

  public getHotkeysForCommand(id: string): {
    all: hotkeyEntry[]
    default: hotkeyEntry[]
    custom: hotkeyEntry[]
  } {
    // Prefer authoritative CommandsManager index when available (sync access).
    logger.timeStart('HotkeyManager.getHotkeysForCommand')
    const cm = this.cmRef
    if (cm) {
      const index = cm.getCommandsIndex()
      const entry = index[id]
      if (entry) {
        return {
          all: entry.hotkeys || [],
          default: entry.defaultHotkeys || [],
          custom: entry.customHotkeys || [],
        }
      }
    }

    // Fallback: use Obsidian app.hotkeyManager only
    const defaultHotkeys = this.app.hotkeyManager.getDefaultHotkeys(id) || []
    const customHotkeys = this.app.hotkeyManager.customKeys[id] || []

    const processHotkeys = (
      hotkeys: KeymapInfo[],
      isCustom: boolean
    ): hotkeyEntry[] => {
      return hotkeys.map(
        (hotkey): hotkeyEntry => ({
          modifiers: Array.isArray(hotkey.modifiers)
            ? hotkey.modifiers
            : typeof hotkey.modifiers === 'string'
              ? (hotkey.modifiers.split(',') as Modifier[])
              : [],
          key: hotkey.key || '',
          isCustom: isCustom,
        })
      )
    }

    const defaultEntries = processHotkeys(defaultHotkeys, false)
    const customEntries = processHotkeys(customHotkeys, true)

    // Create a map to store unique hotkeys
    const hotkeyMap = new Map<string, hotkeyEntry>()

    // Add default hotkeys to the map
    defaultEntries.forEach(entry => {
      const key = this.hotkeyToUniqueKey(entry)
      hotkeyMap.set(key, entry)
    })

    // Add or override with custom hotkeys
    customEntries.forEach(entry => {
      const key = this.hotkeyToUniqueKey(entry)
      hotkeyMap.set(key, entry)
    })

    // Convert the map back to an array
    const allHotkeys = Array.from(hotkeyMap.values())
    logger.timeEnd('HotkeyManager.getHotkeysForCommand')
    return {
      all: allHotkeys,
      default: defaultEntries,
      custom: customEntries,
    }
  }

  private hotkeyToUniqueKey(hotkey: hotkeyEntry): string {
    const sortedModifiers = [...hotkey.modifiers].sort().join(',')
    return `${sortedModifiers}|${hotkey.key}`
  }

  public isHotkeyDuplicate(id: string, hotkey: Hotkey): boolean {
    // Query CommandsManager's hotkeyIndex using a normalized key
    const cm = this.cmRef
    if (!cm) return false
    const hkKey = CommandsManager.makeHotkeyKey({
      modifiers: (hotkey.modifiers as unknown as string[]) || [],
      key: hotkey.key || '',
    })
    const matches = cm.getCommandsByHotkeyKey(hkKey)
    if (matches && matches.length > 0) {
      return matches.some(cmd => cmd.id !== id)
    }
    return false
  }

  public commandMatchesHotkey(
    id: string,
    activeModifiers: Modifier[],
    activeKey: string
  ): boolean {
    const { all: hotkeys } = this.getHotkeysForCommand(id)
    return hotkeys.some(hotkey =>
      this.hotkeyMatches(hotkey, activeModifiers, activeKey)
    )
  }

  private hotkeyMatches(
    hotkey: hotkeyEntry,
    activeModifiers: Modifier[],
    activeKey: string
  ): boolean {
    // Delegate to centralized matcher with platform normalization and strict modifier equality
    return matchHotkey(
      hotkey,
      activeModifiers as unknown as string[],
      activeKey,
      { strictModifierMatch: true, allowKeyOnly: true, platformize: true }
    )
  }

  public renderHotkey(hotkey: hotkeyEntry): string {
    // Ensure consistent display order across platforms
    const mods = sortModifiers(
      platformizeModifiers(hotkey.modifiers as unknown as string[])
    )
    return [...mods, hotkey.key].join(' ')
  }

  public searchHotkeys(
    search: string,
    activeModifiers: Modifier[],
    activeKey: string
  ): commandEntry[] {
    // Prefer authoritative CommandsManager index when available (sync access)
    const cm = this.cmRef
    if (cm) {
      const q = (search || '').toLowerCase()
      // If a hotkey query is present, use fast index-based lookup
      if (activeKey || activeModifiers?.length) {
        const hkKey = CommandsManager.makeHotkeyKey({
          modifiers: activeModifiers as unknown as string[],
          key: activeKey,
        })
        const byHotkey = cm.getCommandsByHotkeyKey(hkKey)
        return byHotkey.filter(cmd =>
          q
            ? cmd.name.toLowerCase().includes(q) ||
              cmd.id.toLowerCase().includes(q)
            : true
        )
      }
      // Name/id only search over all commands
      const index = cm.getCommandsIndex()
      return Object.values(index).filter(cmd =>
        q
          ? cmd.name.toLowerCase().includes(q) ||
            cmd.id.toLowerCase().includes(q)
          : true
      )
    }
    // No safe fallback
    return []
  }
}
