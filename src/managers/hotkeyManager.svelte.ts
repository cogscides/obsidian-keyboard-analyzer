// src/managers/hotkeyManager.svelte.ts
import type { App, KeymapInfo, Hotkey, Modifier, Command } from 'obsidian'
import type { InternalPluginInstance } from 'obsidian'
import type {
  UnsafeAppInterface,
  hotkeyEntry,
  commandEntry,
} from '../interfaces/Interfaces'
import { unconvertModifiers, sortModifiers } from '../utils/modifierUtils'

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
      const pluginId = command.id.split(':')[0]
      acc[command.id] = {
        id: command.id,
        name: command.name,
        hotkeys: hotkeys,
        pluginName: this.getPluginName(pluginId),
        cmdName: command.name,
      }
      return acc
    }, {} as Record<string, commandEntry>)
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

  public getCommand(id: string): commandEntry | null {
    const command = this.app.commands.commands[id]
    if (command) {
      return {
        id: command.id,
        name: command.name,
        hotkeys: this.getHotkeysForCommand(command.id),
        pluginName: this.getPluginName(command.id.split(':')[0]),
        cmdName: command.name,
      }
    }
    return null
  }

  public getHotkeysForCommand(id: string): hotkeyEntry[] {
    const hotkeys = this.getHotkeys(id)
    const defaultHotkeys = this.getDefaultHotkeys(id)

    return [...hotkeys, ...defaultHotkeys].map((hotkey) => ({
      ...this.convertKeymapInfoToHotkey(hotkey),
      isCustom: !this.isDefaultHotkey(hotkey, defaultHotkeys),
    }))
  }

  private getHotkeys(id: string): KeymapInfo[] {
    const unsafeApp = this.app as UnsafeAppInterface
    const hotkeys = unsafeApp.hotkeyManager.getHotkeys(id)
    return Array.isArray(hotkeys) ? hotkeys : []
  }

  private getDefaultHotkeys(id: string): KeymapInfo[] {
    const unsafeApp = this.app as UnsafeAppInterface
    return unsafeApp.hotkeyManager.getDefaultHotkeys(id) || []
  }

  private convertKeymapInfoToHotkey(keymapInfo: KeymapInfo): hotkeyEntry {
    return {
      modifiers: Array.isArray(keymapInfo.modifiers)
        ? keymapInfo.modifiers
        : typeof keymapInfo.modifiers === 'string'
        ? unconvertModifiers(keymapInfo.modifiers.split(','))
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

  public commandMatchesHotkey(
    id: string,
    activeModifiers: Modifier[],
    activeKey: string
  ): boolean {
    const hotkeys = this.getHotkeysForCommand(id)
    return (
      (activeModifiers.length === 0 && !activeKey) ||
      hotkeys.some(
        (hotkey) =>
          this.areModifiersEqual(activeModifiers, hotkey.modifiers) &&
          (!activeKey || hotkey.key.toLowerCase() === activeKey.toLowerCase())
      )
    )
  }

  private areModifiersEqual(
    modifiers1: Modifier[],
    modifiers2: Modifier[]
  ): boolean {
    if (modifiers1.length !== modifiers2.length) return false
    return modifiers1.every((mod) => modifiers2.includes(mod))
  }
}
