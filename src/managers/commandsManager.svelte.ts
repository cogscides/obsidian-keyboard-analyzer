// src/managers/commandsManager.ts
import type { App, Command, Modifier } from 'obsidian'
import type { commandEntry, UnsafeAppInterface } from '../interfaces/Interfaces'
import HotkeyManager from './hotkeyManager.svelte'
import SettingsManager from './settingsManager.svelte'

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
  public visibleCommands: commandEntry[] = []
  private commandGroups: Map<string, CommandGroup> = new Map()

  private constructor(app: App) {
    this.app = app
    this.hotkeyManager = HotkeyManager.getInstance(app)
    this.settingsManager = SettingsManager.getInstance()
    this.loadCommands()
    this.loadCommandGroups()
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
    this.updateVisibleCommands()
  }

  private getCommands(): Command[] {
    return Object.values(this.app.commands.commands)
  }

  private processCommands(commands: Command[]): Record<string, commandEntry> {
    return commands.reduce((acc, command) => {
      const pluginId = command.id.split(':')[0]
      acc[command.id] = {
        id: command.id,
        name: command.name,
        hotkeys: this.hotkeyManager.getHotkeysForCommand(command.id),
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

  public updateVisibleCommands() {
    this.visibleCommands = Object.values(this.commands)
    if (this.settingsManager.getSetting('filterSettings').FeaturedFirst) {
      this.sortByFeaturedFirst()
    }
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

  createGroup(groupName: string) {
    if (!this.commandGroups.has(groupName)) {
      this.commandGroups.set(groupName, { name: groupName, commandIds: [] })
      this.saveCommandGroups()
    }
  }

  addCommandToGroup(groupName: string, commandId: string) {
    if (!this.commandGroups.has(groupName)) {
      this.createGroup(groupName)
    }
    const group = this.commandGroups.get(groupName)
    if (group && !group.commandIds.includes(commandId)) {
      group.commandIds.push(commandId)
      this.saveCommandGroups()
    }
  }

  removeCommandFromGroup(groupName: string, commandId: string) {
    const group = this.commandGroups.get(groupName)
    if (group) {
      group.commandIds = group.commandIds.filter((id) => id !== commandId)
      this.saveCommandGroups()
    }
  }

  getGroup(groupName: string): commandEntry[] {
    const group = this.commandGroups.get(groupName)
    if (!group) return []
    return group.commandIds
      .map((id) => this.hotkeyManager.getCommand(id))
      .filter((command): command is commandEntry => command !== null)
  }

  public getCommandGroups(): Map<string, CommandGroup> {
    return new Map(this.commandGroups)
  }

  public filterCommands(
    search: string,
    activeModifiers: Modifier[],
    activeKey: string,
    selectedGroup?: string
  ) {
    this.visibleCommands = Object.values(this.commands).filter((command) => {
      const nameMatch = `${command.pluginName} ${command.cmdName}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const hotkeyMatch = this.hotkeyManager.commandMatchesHotkey(
        command.id,
        activeModifiers,
        activeKey
      )
      const groupMatch = selectedGroup
        ? this.commandGroups.get(selectedGroup)?.commandIds.includes(command.id)
        : true
      return nameMatch && hotkeyMatch && groupMatch
    })
  }

  public toggleFeaturedCommand(commandId: string) {
    const featuredCommandIDs =
      this.settingsManager.getSetting('featuredCommandIDs')
    const index = featuredCommandIDs.indexOf(commandId)
    if (index > -1) {
      featuredCommandIDs.splice(index, 1)
    } else {
      featuredCommandIDs.push(commandId)
    }
    this.settingsManager.updateSettings({ featuredCommandIDs })
    this.updateVisibleCommands()
  }

  public sortByFeaturedFirst() {
    const featuredCommandIDs =
      this.settingsManager.getSetting('featuredCommandIDs')
    this.visibleCommands.sort((a, b) => {
      const aFeatured = featuredCommandIDs.includes(a.id)
      const bFeatured = featuredCommandIDs.includes(b.id)
      if (aFeatured && !bFeatured) return -1
      if (!aFeatured && bFeatured) return 1
      return 0
    })
  }

  public refreshCommands() {
    this.loadCommands()
  }

  // Add more methods as needed for advanced filtering, sorting, etc.
}
