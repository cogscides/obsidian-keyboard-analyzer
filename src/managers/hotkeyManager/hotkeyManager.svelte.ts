import type { App, KeymapInfo, Hotkey, Modifier, Command } from 'obsidian'
import type {
  hotkeyEntry,
  commandEntry,
  UnsafeInternalPlugin,
} from '../../interfaces/Interfaces'
import {
  sortModifiers,
  modifiersToString,
  areModifiersEqual,
  platformizeModifiers,
  matchHotkey,
} from '../../utils/modifierUtils'
import { buildCommandEntry } from '../../utils/commandBuilder'

export default class HotkeyManager {
  private static instance: HotkeyManager | null = null
  private app: App
  // HotkeyManager no longer holds a local commands mirror; lookups should query
  // the authoritative CommandsManager.getCommandsIndex() when available and
  // fall back to building entries from app.commands when necessary.
  // When command data is required we will attempt to query CommandsManager's authoritative index.
  private constructor(app: App) {
    this.app = app
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
    try {
      // Lazy require to avoid circular import at module evaluation time.
      // Prefer requiring the manager index (safer resolution) instead of the concrete .svelte.ts file.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const CommandsManagerModule = require('../commandsManager')
      const CommandsManagerClass =
        CommandsManagerModule?.default || CommandsManagerModule
      if (
        CommandsManagerClass &&
        typeof CommandsManagerClass.getInstance === 'function'
      ) {
        // CommandsManager.getInstance requires (app, plugin) — call with app and undefined plugin.
        // Implementation is defensive and will still construct the instance if needed.
        const cm = CommandsManagerClass.getInstance(this.app, undefined)
        if (cm && typeof cm.getCommandsIndex === 'function') {
          return cm.getCommandsIndex()
        }
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: build entries locally using the centralized builder (keeps runtime shape)
    try {
      const commandsObj = this.app.commands.commands || {}
      const commands = Object.values(commandsObj) as Command[]
      return commands.reduce((acc, command) => {
        acc[command.id] = buildCommandEntry(this.app, this, command)
        return acc
      }, {} as Record<string, commandEntry>)
    } catch {
      return {}
    }
  }

  private isInternalModule(commandId: string): boolean {
    const pluginId = (commandId || '').split(':')[0] || ''
    const internalModules = [
      'audio-recorder',
      'backlink',
      'bookmarks',
      'canvas',
      'command-palette',
      'daily-notes',
      'editor-status',
      'file-explorer',
      'file-recovery',
      'global-search',
      'graph',
      'markdown-importer',
      'note-composer',
      'outgoing-link',
      'outline',
      'page-preview',
      'properties',
      'publish',
      'random-note',
      'slash-command',
      'slides',
      'starred',
      'switcher',
      'sync',
      'tag-pane',
      'templates',
      'word-count',
      'workspaces',
      'zk-prefixer',
    ]
    const coreNamespaces = [
      'app',
      'editor',
      'markdown',
      'open-with-default-app',
      'theme',
      'window',
      'workspace',
    ]
    if (internalModules.includes(pluginId)) return true
    if (coreNamespaces.includes(pluginId)) return true
    // Heuristic fallback: not a community plugin => internal
    const isCommunity = Boolean(this.app.plugins.plugins[pluginId])
    if (isCommunity) return false
    const enabledInternal = this.app.internalPlugins.getEnabledPlugins()
    const isInternal = enabledInternal.some((p) => p.instance.id === pluginId)
    return isInternal || !isCommunity
  }

  private getPluginName(pluginId: string): string {
    const plugin = this.app.plugins.plugins[pluginId]
    if (plugin) return plugin.manifest.name

    const internalPlugins = this.app.internalPlugins.getEnabledPlugins()

    const internalPlugin = internalPlugins.find(
      (plugin) => plugin.instance.id === pluginId
    ) as UnsafeInternalPlugin | undefined

    if (internalPlugin?.instance) {
      return internalPlugin.instance.name || pluginId
    }

    return pluginId
  }

  public getHotkeysForCommand(id: string): {
    all: hotkeyEntry[]
    default: hotkeyEntry[]
    custom: hotkeyEntry[]
  } {
    // Prefer authoritative CommandsManager index when available (sync access).
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const CommandsManagerModule = require('../commandsManager/commandsManager.svelte.ts')
      const CommandsManagerClass = CommandsManagerModule.default
      if (
        CommandsManagerClass &&
        typeof CommandsManagerClass.getInstance === 'function'
      ) {
        const cm = CommandsManagerClass.getInstance(this.app, undefined)
        if (cm && typeof cm.getCommandsIndex === 'function') {
          const index = cm.getCommandsIndex() as Record<string, commandEntry>
          const entry = index[id]
          if (
            entry &&
            Array.isArray(entry.hotkeys) &&
            entry.hotkeys.length >= 0
          ) {
            return {
              all: entry.hotkeys || [],
              default: (entry as any).defaultHotkeys || [],
              custom: (entry as any).customHotkeys || [],
            }
          }
        }
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: use app.hotkeyManager data
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
    defaultEntries.forEach((entry) => {
      const key = this.hotkeyToUniqueKey(entry)
      hotkeyMap.set(key, entry)
    })

    // Add or override with custom hotkeys
    customEntries.forEach((entry) => {
      const key = this.hotkeyToUniqueKey(entry)
      hotkeyMap.set(key, entry)
    })

    // Convert the map back to an array
    const allHotkeys = Array.from(hotkeyMap.values())

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
    // Prefer authoritative CommandsManager index when available (sync access)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const CommandsManagerModule = require('../commandsManager/commandsManager.svelte.ts')
      const CommandsManagerClass = CommandsManagerModule.default
      if (
        CommandsManagerClass &&
        typeof CommandsManagerClass.getInstance === 'function'
      ) {
        const cm = CommandsManagerClass.getInstance(this.app, undefined)
        if (cm && typeof cm.getCommandsIndex === 'function') {
          const index = cm.getCommandsIndex() as Record<string, commandEntry>
          return Object.values(index).some(
            (command) =>
              command.id !== id &&
              command.hotkeys.some(
                (existingHotkey) =>
                  areModifiersEqual(
                    existingHotkey.modifiers,
                    hotkey.modifiers
                  ) && existingHotkey.key === hotkey.key
              )
          )
        }
      }
    } catch {
      // ignore and fallback to local build below
    }

    // Fallback: build a local view of commands from app.commands (defensive, sync)
    try {
      const commandsObj = this.app.commands.commands || {}
      return Object.values(commandsObj).some((cmd: any) => {
        const entry = buildCommandEntry(this.app, this, cmd as any)
        return (
          entry.id !== id &&
          entry.hotkeys.some(
            (existingHotkey: hotkeyEntry) =>
              areModifiersEqual(existingHotkey.modifiers, hotkey.modifiers) &&
              existingHotkey.key === hotkey.key
          )
        )
      })
    } catch {
      return false
    }
  }

  public commandMatchesHotkey(
    id: string,
    activeModifiers: Modifier[],
    activeKey: string
  ): boolean {
    const { all: hotkeys } = this.getHotkeysForCommand(id)
    return hotkeys.some((hotkey) =>
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
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const CommandsManagerModule = require('../commandsManager/commandsManager.svelte.ts')
      const CommandsManagerClass = CommandsManagerModule.default
      if (
        CommandsManagerClass &&
        typeof CommandsManagerClass.getInstance === 'function'
      ) {
        const cm = CommandsManagerClass.getInstance(this.app, undefined)
        if (cm && typeof cm.getCommandsIndex === 'function') {
          const index = cm.getCommandsIndex() as Record<string, commandEntry>
          return Object.values(index).filter((command) => {
            const hotkeyMatch = this.commandMatchesHotkey(
              command.id,
              activeModifiers,
              activeKey
            )
            const searchMatch =
              command.name.toLowerCase().includes(search.toLowerCase()) ||
              command.id.toLowerCase().includes(search.toLowerCase())
            return hotkeyMatch && searchMatch
          })
        }
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: build synchronously from app.commands
    try {
      const commandsObj = this.app.commands.commands || {}
      return Object.values(commandsObj)
        .map((cmd: any) => buildCommandEntry(this.app, this, cmd as any))
        .filter((command) => {
          const hotkeyMatch = this.commandMatchesHotkey(
            command.id,
            activeModifiers,
            activeKey
          )
          const searchMatch =
            command.name.toLowerCase().includes(search.toLowerCase()) ||
            command.id.toLowerCase().includes(search.toLowerCase())
          return hotkeyMatch && searchMatch
        })
    } catch {
      return []
    }
  }
}
