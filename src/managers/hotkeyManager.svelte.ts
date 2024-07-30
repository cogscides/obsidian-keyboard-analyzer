// src/managers/hotkeyManager.svelte.ts
import type {
  App,
  HotkeyManager as ObsidianHotkeyManager,
  KeymapInfo,
  Hotkey,
  Command,
  Modifier,
} from 'obsidian'
import type {
  UnsafeAppInterface,
  hotkeyDict,
  hotkeyEntry,
  commandEntry,
} from '../interfaces/Interfaces'
import {
  getConvertedModifiers,
  getUnconvertedModifiers,
  sortModifiers,
} from '../utils/modifierUtils'

export default class HotkeyManager {
  private static instance: HotkeyManager | null = null
  private app: App
  private commands: Record<string, commandEntry> = {}
  private isInitialized = false
  private filteredCommands: commandEntry[] = $state([])

  private constructor(app: App) {
    this.app = app
  }

  static getInstance(app: App): HotkeyManager {
    if (!HotkeyManager.instance) {
      HotkeyManager.instance = new HotkeyManager(app)
    }
    return HotkeyManager.instance
  }

  private getHotkeys(id: string): KeymapInfo[] {
    // console.log(`Getting hotkeys for id: ${id}`)
    const unsafeApp = this.app as UnsafeAppInterface
    const hotkeys = unsafeApp.hotkeyManager.getHotkeys(id)
    // console.log(`Hotkeys for ${id}:`, hotkeys)
    return Array.isArray(hotkeys) ? hotkeys : []
  }

  async initialize() {
    if (!this.isInitialized) {
      this.commands = await this.getAllHotkeys()
      // console.log('Initialized commands:', this.commands)
      if (Object.keys(this.commands).length === 0) {
        console.warn(
          'No commands were loaded. This might indicate an issue with the plugin or Obsidian API.'
        )
      }
      this.isInitialized = true
    }
  }

  private async getAllHotkeys(): Promise<Record<string, commandEntry>> {
    try {
      // console.log('Getting all hotkeys')
      const commands = this.getCommands()
      // console.log('Commands:', commands)
      return this.processCommands(commands)
    } catch (error) {
      console.error('Error getting all hotkeys:', error)
      return {}
    }
  }

  private getCommands(): Command[] {
    const unsafeApp = this.app as UnsafeAppInterface
    const commands = unsafeApp.commands.commands
    return Object.values(commands)
  }

  getDefaultHotkeys(id: string): KeymapInfo[] {
    const unsafeApp = this.app as UnsafeAppInterface
    return unsafeApp.hotkeyManager.getDefaultHotkeys(id) || []
  }

  private getHotkeysForCommand(id: string): hotkeyEntry[] {
    // console.log(`Getting hotkeys for command: ${id}`)
    try {
      const hotkeys = this.getHotkeys(id)
      // console.log('Hotkeys:', hotkeys)
      const defaultHotkeys = this.getDefaultHotkeys(id)
      // console.log('Default hotkeys:', defaultHotkeys)

      if (!Array.isArray(hotkeys)) {
        console.warn(`Hotkeys for ${id} is not an array:`, hotkeys)
        return []
      }

      return [...hotkeys, ...defaultHotkeys].map((hotkey) => {
        // console.log('Processing hotkey:', hotkey)
        return {
          ...this.convertKeymapInfoToHotkey(hotkey),
          isCustom: !this.isDefaultHotkey(hotkey, defaultHotkeys),
        }
      })
    } catch (error) {
      console.error(`Error in getHotkeysForCommand for ${id}:`, error)
      return []
    }
  }

  private processCommands(commands: Command[]): Record<string, commandEntry> {
    // console.log('Processing commands:', commands)
    return commands.reduce((acc, command) => {
      // console.log('Processing command:', command)
      try {
        const hotkeys = this.getHotkeysForCommand(command.id)
        const pluginId = command.id.split(':')[0]
        acc[command.id] = {
          id: command.id,
          name: command.name,
          hotkeys: hotkeys,
          pluginName: this.getPluginName(pluginId),
          cmdName: command.name,
        }
      } catch (error) {
        console.error(`Error processing command ${command.id}:`, error)
      }
      return acc
    }, {} as Record<string, commandEntry>)
  }

  private convertKeymapInfoToHotkey(keymapInfo: KeymapInfo): hotkeyEntry {
    return {
      modifiers: Array.isArray(keymapInfo.modifiers)
        ? keymapInfo.modifiers
        : typeof keymapInfo.modifiers === 'string'
        ? getUnconvertedModifiers(keymapInfo.modifiers.split(','))
        : [],
      key: keymapInfo.key || '',
      isCustom: false,
    }
  }

  private isDefaultHotkey(
    hotkey: KeymapInfo,
    defaultHotkeys: KeymapInfo[]
  ): boolean {
    return defaultHotkeys.some((defaultHotkey) =>
      this.areKeymapInfoEqual(hotkey, defaultHotkey)
    )
  }

  private areKeymapInfoEqual(a: KeymapInfo, b: KeymapInfo): boolean {
    return a.key === b.key && a.modifiers === b.modifiers
  }

  private getPluginName(pluginId: string): string {
    if (pluginId === 'editor') return 'Editor'
    if (pluginId === 'workspace') return 'Workspace'

    const plugin = (this.app as UnsafeAppInterface).plugins.plugins[pluginId]
    if (plugin) {
      return plugin.manifest.name
    }

    const internalPlugin = (
      this.app as UnsafeAppInterface
    ).internalPlugins.getPluginById(pluginId)
    if (internalPlugin?.instance) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      return (internalPlugin.instance as any).name || pluginId
    }

    return pluginId
  }

  public getSortedCommands(): commandEntry[] {
    return Object.values(this.commands)
      .filter((command) => command.pluginName && command.cmdName)
      .sort((a, b) => {
        const pluginNameComparison = (a.pluginName || '').localeCompare(
          b.pluginName || ''
        )
        if (pluginNameComparison !== 0) return pluginNameComparison
        return (a.cmdName || '').localeCompare(b.cmdName || '')
      })
  }

  public isHotkeyDuplicate(id: string, hotkey: Hotkey): boolean {
    return Object.values(this.commands).some(
      (command) =>
        command.id !== id &&
        command.hotkeys.some(
          (existingHotkey) =>
            existingHotkey.modifiers.join(',') === hotkey.modifiers.join(',') &&
            existingHotkey.key === hotkey.key
        )
    )
  }

  public filterCommands(
    search: string,
    activeModifiers: Modifier[],
    activeKey: string
  ) {
    this.filteredCommands = Object.values(this.commands).filter((command) => {
      const nameMatch = `${command.pluginName} ${command.cmdName}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const modifierMatch =
        activeModifiers.length === 0 ||
        command.hotkeys.some((hotkey) =>
          this.areModifiersEqual(activeModifiers, hotkey.modifiers)
        )
      const keyMatch =
        !activeKey ||
        command.hotkeys.some(
          (hotkey) => hotkey.key.toLowerCase() === activeKey.toLowerCase()
        )

      return nameMatch && modifierMatch && keyMatch
    })
  }

  public getFilteredCommands(): commandEntry[] {
    return this.filteredCommands
  }

  public refreshCommands() {
    this.isInitialized = false
    this.initialize()
  }

  private areModifiersEqual(
    modifiers1: Modifier[],
    modifiers2: Modifier[]
  ): boolean {
    if (modifiers1.length !== modifiers2.length) return false
    return modifiers1.every((mod) => modifiers2.includes(mod))
  }
}
