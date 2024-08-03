import type { App, KeymapInfo, Hotkey, Modifier, Command } from 'obsidian'
import type {
  UnsafeAppInterface,
  hotkeyEntry,
  commandEntry,
  UnsafeInternalPlugin,
  UnsafeInternalPluginInstance,
} from '../interfaces/Interfaces'
import {
  convertModifiers,
  sortModifiers,
  modifiersToString,
  areModifiersEqual,
  isKeyMatch,
} from '../utils/modifierUtils'

export default class HotkeyManager {
  private static instance: HotkeyManager | null = null
  private app: App
  private commands: Record<string, commandEntry> = {}

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
    this.commands = await this.getAllHotkeys()
  }

  private async getAllHotkeys(): Promise<Record<string, commandEntry>> {
    const commands = this.getCommands()
    return this.processCommands(commands)
  }

  private getCommands(): Command[] {
    const unsafeApp = this.app as UnsafeAppInterface
    const commands = unsafeApp.commands.commands
    return Object.values(commands)
  }

  private processCommands(commands: Command[]): Record<string, commandEntry> {
    return commands.reduce((acc, command) => {
      const hotkeys = this.getHotkeysForCommand(command.id)
      const [pluginId, cmdName] = command.id.split(':')
      acc[command.id] = {
        id: command.id,
        name: command.name,
        hotkeys: hotkeys.all,
        defaultHotkeys: hotkeys.default,
        customHotkeys: hotkeys.custom,
        isInternalModule: this.isInternalModule(command.id), // Add this line
        pluginName: this.getPluginName(pluginId),
        cmdName: cmdName || command.name,
      }
      return acc
    }, {} as Record<string, commandEntry>)
  }

  private isInternalModule(commandId: string): boolean {
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
    return internalModules.some((module) => commandId.startsWith(module))
  }

  private getPluginName(pluginId: string): string {
    const plugin = (this.app as UnsafeAppInterface).plugins.plugins[pluginId]
    if (plugin) return plugin.manifest.name

    const internalPlugins = (
      this.app as UnsafeAppInterface
    ).internalPlugins.getEnabledPlugins()

    const internalPlugin = internalPlugins.find(
      (plugin) =>
        (plugin.instance as UnsafeInternalPluginInstance).id === pluginId
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
    const unsafeApp = this.app as UnsafeAppInterface
    const defaultHotkeys = unsafeApp.hotkeyManager.getDefaultHotkeys(id) || []
    const customHotkeys = unsafeApp.hotkeyManager.customKeys[id] || []

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

  public getAllHotkeysForCommand(id: string): hotkeyEntry[] {
    const { all } = this.getHotkeysForCommand(id)
    return all
  }

  public isHotkeyDuplicate(id: string, hotkey: Hotkey): boolean {
    return Object.values(this.commands).some(
      (command) =>
        command.id !== id &&
        command.hotkeys.some(
          (existingHotkey) =>
            areModifiersEqual(existingHotkey.modifiers, hotkey.modifiers) &&
            existingHotkey.key === hotkey.key
        )
    )
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
    const modifiersMatch = areModifiersEqual(
      sortModifiers(activeModifiers),
      sortModifiers(hotkey.modifiers)
    )
    const keyMatch = !activeKey || isKeyMatch(activeKey, hotkey.key)
    return modifiersMatch && keyMatch
  }

  public renderHotkey(hotkey: hotkeyEntry): string {
    const bakedModifiers = convertModifiers(hotkey.modifiers)
    return [...bakedModifiers, hotkey.key].join(' + ')
  }

  public searchHotkeys(
    search: string,
    activeModifiers: Modifier[],
    activeKey: string
  ): commandEntry[] {
    return Object.values(this.commands).filter((command) => {
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
