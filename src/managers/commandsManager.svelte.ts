import type { App, Modifier } from 'obsidian'
import type { Commands, Command } from 'obsidian-typings'
import type {
  hotkeyEntry,
  UnsafeInternalPlugin,
  UnsafeInternalPluginInstance,
} from '../interfaces/Interfaces'
import type { commandEntry, UnsafeAppInterface } from '../interfaces/Interfaces'
import HotkeyManager from './hotkeyManager.svelte'
import SettingsManager from './settingsManager.svelte'
import {
  convertModifiers,
  unconvertModifiers,
  areModifiersEqual,
  isKeyMatch,
} from '../utils/modifierUtils'

interface CommandGroup {
  name: string
  commandIds: string[]
}

export class CommandsManager {
  private static instance: CommandsManager | null = null
  private app: App
  private hotkeyManager: HotkeyManager
  private settingsManager: SettingsManager
  private commands: Record<string, commandEntry> = {}
  private commandGroups: Map<string, CommandGroup> = new Map()
  private featuredCommandIds: Set<string> = new Set()
  private recentCommandIds: string[] = []

  private constructor(app: App) {
    this.app = app
    this.hotkeyManager = HotkeyManager.getInstance(app)
    this.settingsManager = SettingsManager.getInstance()
    this.loadCommands()
    this.loadCommandGroups()
    this.loadFeaturedCommands()
  }

  static getInstance(app: App): CommandsManager {
    if (!CommandsManager.instance) {
      CommandsManager.instance = new CommandsManager(app)
    }
    return CommandsManager.instance
  }

  private loadCommands() {
    const allCommands = this.getCommands()
    this.commands = this.processCommands(allCommands)
  }

  private getCommands(): Command[] {
    const unsafeApp = this.app as UnsafeAppInterface
    return Object.values(unsafeApp.commands.commands)
  }

  private processCommands(commands: Command[]): Record<string, commandEntry> {
    return commands.reduce((acc, command) => {
      const [pluginId, cmdName] = command.id.split(':')
      const hotkeys = this.hotkeyManager.getHotkeysForCommand(command.id)
      acc[command.id] = {
        id: command.id,
        name: command.name,
        hotkeys: hotkeys.all,
        defaultHotkeys: hotkeys.default,
        customHotkeys: hotkeys.custom,
        pluginName: this.getPluginName(pluginId),
        cmdName: cmdName || command.name,
      }
      return acc
    }, {} as Record<string, commandEntry>)
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

  private loadCommandGroups() {
    const savedGroups = this.settingsManager.getSetting('commandGroups') || []
    savedGroups.forEach((group) => {
      this.commandGroups.set(group.name, group)
    })
  }

  private saveCommandGroups() {
    const groupsArray = Array.from(this.commandGroups.values())
    this.settingsManager.updateSettings({ commandGroups: groupsArray })
  }

  private loadFeaturedCommands() {
    const featuredCommands =
      this.settingsManager.getSetting('featuredCommandIDs') || []
    this.featuredCommandIds = new Set(featuredCommands)
  }

  public createGroup(groupName: string) {
    if (!this.commandGroups.has(groupName)) {
      this.commandGroups.set(groupName, { name: groupName, commandIds: [] })
      this.saveCommandGroups()
    }
  }

  public addCommandToGroup(groupName: string, commandId: string) {
    if (!this.commandGroups.has(groupName)) {
      this.createGroup(groupName)
    }
    const group = this.commandGroups.get(groupName)
    if (group && !group.commandIds.includes(commandId)) {
      group.commandIds.push(commandId)
      this.saveCommandGroups()
    }
  }

  public removeCommandFromGroup(groupName: string, commandId: string) {
    const group = this.commandGroups.get(groupName)
    if (group) {
      group.commandIds = group.commandIds.filter((id) => id !== commandId)
      this.saveCommandGroups()
    }
  }

  public getGroup(groupName: string): commandEntry[] {
    if (groupName === 'Featured') {
      return Array.from(this.featuredCommandIds)
        .map((id) => this.commands[id])
        .filter(Boolean)
    }
    if (groupName === 'Recent') {
      return this.recentCommandIds
        .map((id) => this.commands[id])
        .filter(Boolean)
    }
    const group = this.commandGroups.get(groupName)
    if (!group) return []
    return group.commandIds.map((id) => this.commands[id]).filter(Boolean)
  }

  public getCommandGroups(): string[] {
    return ['Featured', 'Recent', ...Array.from(this.commandGroups.keys())]
  }

  public toggleFeaturedCommand(commandId: string) {
    if (this.featuredCommandIds.has(commandId)) {
      this.featuredCommandIds.delete(commandId)
    } else {
      this.featuredCommandIds.add(commandId)
    }
    this.settingsManager.updateSettings({
      featuredCommandIDs: Array.from(this.featuredCommandIds),
    })
  }

  public addRecentCommand(commandId: string) {
    this.recentCommandIds = [
      commandId,
      ...this.recentCommandIds.filter((id) => id !== commandId),
    ].slice(0, 10)
  }

  public filterCommands(
    search: string,
    activeModifiers: string[],
    activeKey: string,
    selectedGroup?: string
  ): commandEntry[] {
    const filterSettings = this.settingsManager.getSetting('filterSettings')
    const searchLower = search.toLowerCase()

    const filteredCommands = Object.values(this.commands).filter((command) => {
      const nameMatch =
        `${command.pluginName} ${command.cmdName}`
          .toLowerCase()
          .includes(searchLower) ||
        (filterSettings.DisplayIDs &&
          command.id.toLowerCase().includes(searchLower))

      const hotkeyMatch =
        activeModifiers.length === 0 && !activeKey
          ? true
          : command.hotkeys.some((hotkey) =>
              this.hotkeyMatches(hotkey, activeModifiers, activeKey)
            )

      const groupMatch = this.matchesGroup(command, selectedGroup)

      return nameMatch && hotkeyMatch && groupMatch
    })

    if (filterSettings.FeaturedFirst) {
      return this.sortByFeaturedFirst(filteredCommands)
    }

    return filteredCommands
  }

  private commandMatchesHotkey(
    id: string,
    activeModifiers: string[],
    activeKey: string
  ): boolean {
    const { all: hotkeys } = this.hotkeyManager.getHotkeysForCommand(id)
    return hotkeys.some((hotkey) =>
      this.hotkeyMatches(hotkey, activeModifiers, activeKey)
    )
  }

  private hotkeyMatches(
    hotkey: hotkeyEntry,
    activeModifiers: string[],
    activeKey: string
  ): boolean {
    const convertedActiveModifiers = convertModifiers(activeModifiers)
    const convertedHotkeyModifiers = convertModifiers(hotkey.modifiers)

    const modifiersMatch = areModifiersEqual(
      convertedActiveModifiers,
      convertedHotkeyModifiers
    )
    const keyMatch = !activeKey || isKeyMatch(activeKey, hotkey.key)
    return modifiersMatch && keyMatch
  }

  private matchesGroup(command: commandEntry, selectedGroup?: string): boolean {
    if (!selectedGroup) return true
    if (selectedGroup === 'Featured') {
      return this.featuredCommandIds.has(command.id)
    }
    if (selectedGroup === 'Recent') {
      return this.recentCommandIds.includes(command.id)
    }
    const group = this.commandGroups.get(selectedGroup)
    return group ? group.commandIds.includes(command.id) : true
  }

  private sortByFeaturedFirst(commands: commandEntry[]): commandEntry[] {
    return commands.sort((a, b) => {
      const aFeatured = this.featuredCommandIds.has(a.id)
      const bFeatured = this.featuredCommandIds.has(b.id)
      if (aFeatured && !bFeatured) return -1
      if (!aFeatured && bFeatured) return 1
      return 0
    })
  }

  public refreshCommands() {
    this.loadCommands()
  }
}
