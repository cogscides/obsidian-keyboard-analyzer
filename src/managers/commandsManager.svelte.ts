import type { App, Modifier } from 'obsidian'
import type { InternalPluginName, Commands, Command } from 'obsidian-typings'
import type {
  hotkeyEntry,
  UnsafeInternalPlugin,
  UnsafeInternalPluginInstance,
} from '../interfaces/Interfaces'
import type { commandEntry, UnsafeAppInterface } from '../interfaces/Interfaces'
import HotkeyManager from './hotkeyManager.svelte'
import SettingsManager, { type CommandGroup } from './settingsManager.svelte'
import {
  convertModifiers,
  unconvertModifiers,
  areModifiersEqual,
  isKeyMatch,
} from '../utils/modifierUtils'

/**
 * The CommandsManager class is responsible for managing and processing commands.
 * It provides methods for loading, filtering, and managing command groups.
 *
 * @class CommandsManager
 */
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

  /**
   * Loads all commands from the app and processes them into a more usable format
   *
   * @private
   * @returns void
   */
  private loadCommands() {
    const allCommands = this.getCommands()
    this.commands = this.processCommands(allCommands)
  }

  /**
   * Returns all commands from the app
   *
   * @private
   * @returns Command[]
   */
  private getCommands(): Command[] {
    const unsafeApp = this.app as UnsafeAppInterface
    return Object.values(unsafeApp.commands.commands)
  }

  /**
   * Processes the commands into a more usable format
   *
   * @private
   * @param commands - The commands to process
   * @returns Record<string, commandEntry>
   */
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
        isInternalModule: this.isInternalModule(command.id),
        pluginName: this.getPluginName(pluginId),
        cmdName: cmdName || command.name,
      }
      return acc
    }, {} as Record<string, commandEntry>)
  }

  /**
   * Returns the name of the plugin for a given plugin ID
   *
   * @private
   * @param pluginId - The ID of the plugin to get the name of
   * @returns string - The name of the plugin
   */
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

  /**
   * Returns a boolean value indicating if a command is an internal module
   *
   * @param commandId - The ID of the command to check
   * @returns boolean
  * @types of InternalPluginName from obsidian-typings
  type InternalPluginName =
		| "audio-recorder"
		| "backlink"
		| "bookmarks"
		| "canvas"
		| "command-palette"
		| "daily-notes"
		| "editor-status"
		| "file-explorer"
		| "file-recovery"
		| "global-search"
		| "graph"
		| "markdown-importer"
		| "note-composer"
		| "outgoing-link"
		| "outline"
		| "page-preview"
		| "properties"
		| "publish"
		| "random-note"
		| "slash-command"
		| "slides"
		| "starred"
		| "switcher"
		| "sync"
		| "tag-pane"
		| "templates"
		| "word-count"
		| "workspaces"
		| "zk-prefixer";
   */
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
    ] as InternalPluginName[]

    return internalModules.some((module) => commandId.startsWith(module))
  }

  // Groups  ------------------------ //

  /**
   * Loads the command groups from the settings
   *
   * @private
   * @returns void
   */
  private loadCommandGroups() {
    const savedGroups = this.settingsManager.getSetting('commandGroups') || []
    savedGroups.forEach((group) => {
      this.commandGroups.set(group.name, group)
    })
  }

  /**
   * Saves the command groups to the settings
   *
   * @private
   * @returns void
   */
  private saveCommandGroups() {
    const groupsArray = Array.from(this.commandGroups.values()).map(
      (group) => ({
        ...group,
        excludedModules: group.excludedModules || [],
      })
    )
    this.settingsManager.updateSettings({ commandGroups: groupsArray })
  }

  /**
   * Loads the featured commands from the settings
   *
   * @private
   * @returns void
   */
  private loadFeaturedCommands() {
    const featuredCommands =
      this.settingsManager.getSetting('featuredCommandIDs') || []
    this.featuredCommandIds = new Set(featuredCommands)
  }

  /**
   * Creates a new command group
   *
   * @param groupName - The name of the group to create
   * @returns void
   */
  public createGroup(groupName: string) {
    if (!this.commandGroups.has(groupName)) {
      this.commandGroups.set(groupName, {
        name: groupName,
        commandIds: [],
        excludedModules: [],
      })
      this.saveCommandGroups()
    }
  }

  /**
   * Adds a command to a group
   *
   * @param groupName - The name of the group to add the command to
   * @param commandId - The ID of the command to add
   * @returns void
   */
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

  /**
   * Removes a command from a group
   *
   * @param groupName - The name of the group to remove the command from
   * @param commandId - The ID of the command to remove
   * @returns void
   */
  public removeCommandFromGroup(groupName: string, commandId: string) {
    const group = this.commandGroups.get(groupName)
    if (group) {
      group.commandIds = group.commandIds.filter(
        (id: string) => id !== commandId
      )
      this.saveCommandGroups()
    }
  }

  /**
   * Returns the commands in a group
   *
   * @param groupName - The name of the group to get the commands from
   * @returns commandEntry[]
   */
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
    return group.commandIds
      .map((id: string) => this.commands[id])
      .filter(Boolean)
  }

  /**
   * Returns the names of the command groups
   *
   * @returns string[]
   */
  public getCommandGroups(): string[] {
    return ['Featured', 'Recent', ...Array.from(this.commandGroups.keys())]
  }

  /**
   * Toggles a command as featured
   *
   * @param commandId - The ID of the command to toggle
   * @returns void
   */
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

  /**
   * Adds a command to the recent commands list
   *
   * @param commandId - The ID of the command to add
   * @returns void
   */
  public addRecentCommand(commandId: string) {
    this.recentCommandIds = [
      commandId,
      ...this.recentCommandIds.filter((id) => id !== commandId),
    ].slice(0, 10)
  }

  // Filtering  ------------------------ //
  /**
   * Filters the commands based on the given search, active modifiers, active key, and selected group
   *
   * @param search - The search string
   * @param activeModifiers - The active modifiers
   * @param activeKey - The active key
   * @param selectedGroup - The selected group
   * @returns commandEntry[]
   */
  public filterCommands(
    search: string,
    activeModifiers: string[],
    activeKey: string,
    selectedGroup?: string
  ): commandEntry[] {
    console.log(
      'filterCommands:',
      search,
      activeModifiers,
      activeKey,
      selectedGroup
    )

    const filterSettings = this.settingsManager.getSetting('filterSettings')

    // Start with all commands for the selected group
    let commandsToFilter = this.getCommandsForGroup(selectedGroup)

    // If no search and no active hotkeys, return all commands for the selected group
    if (!search && activeModifiers.length === 0 && !activeKey) {
      return commandsToFilter
    }

    const searchLower = search.toLowerCase()

    const filteredCommands = commandsToFilter.filter((command) => {
      const nameMatch =
        `${command.pluginName} ${command.cmdName}`
          .toLowerCase()
          .includes(searchLower) ||
        (filterSettings.DisplayIDs &&
          command.id.toLowerCase().includes(searchLower))

      // If there's a search, only filter by the search term
      if (search) {
        return nameMatch
      }

      const hotkeyMatch = command.hotkeys.some((hotkey) =>
        this.hotkeyMatches(
          hotkey,
          activeModifiers,
          activeKey,
          filterSettings.StrictModifierMatch
        )
      )

      const hasHotkeysMatch = filterSettings.DisplayWOhotkeys
        ? true
        : command.hotkeys.length > 0

      const internalModuleMatch = filterSettings.DisplayInternalModules
        ? true
        : !command.isInternalModule

      return nameMatch && hotkeyMatch && hasHotkeysMatch && internalModuleMatch
    })

    if (filterSettings.FeaturedFirst) {
      return this.sortByFeaturedFirst(filteredCommands)
    }

    return filteredCommands
  }

  // Helper functions  ------------------------ //

  /**
   * Checks if a command matches a hotkey
   *
   * @private
   * @param id - The ID of the command to check
   * @param activeModifiers - The active modifiers
   * @param activeKey - The active key
   * @returns boolean
   */
  private commandMatchesHotkey(
    id: string,
    activeModifiers: string[],
    activeKey: string,
    strictModifierMatch: boolean
  ): boolean {
    const { all: hotkeys } = this.hotkeyManager.getHotkeysForCommand(id)
    return hotkeys.some((hotkey) =>
      this.hotkeyMatches(
        hotkey,
        activeModifiers,
        activeKey,
        strictModifierMatch
      )
    )
  }

  /**
   * Checks if a hotkey matches the active modifiers and key
   *
   * @private
   * @param hotkey - The hotkey to check
   * @param activeModifiers - The active modifiers
   * @param activeKey - The active key
   * @returns boolean
   */
  private hotkeyMatches(
    hotkey: hotkeyEntry,
    activeModifiers: string[],
    activeKey: string,
    strictModifierMatch: boolean
  ): boolean {
    const convertedActiveModifiers = convertModifiers(activeModifiers)
    const convertedHotkeyModifiers = convertModifiers(hotkey.modifiers)

    let modifiersMatch: boolean
    if (strictModifierMatch) {
      modifiersMatch = areModifiersEqual(
        convertedActiveModifiers,
        convertedHotkeyModifiers
      )
    } else {
      modifiersMatch = convertedActiveModifiers.every((mod) =>
        convertedHotkeyModifiers.includes(mod)
      )
    }

    const keyMatch = !activeKey || isKeyMatch(activeKey, hotkey.key)

    // Allow matching when there's only an active key and no modifiers
    if (activeKey && activeModifiers.length === 0) {
      return keyMatch
    }

    return modifiersMatch && keyMatch
  }

  /**
   * Checks if a command matches a group
   * @param selectedGroup - The selected group
   * @returns commandEntry[]
   */
  private getCommandsForGroup(selectedGroup?: string): commandEntry[] {
    if (!selectedGroup || selectedGroup === '')
      return Object.values(this.commands)
    return this.getGroup(selectedGroup)
  }

  /**
   * Checks if a command matches a group
   *
   * @private
   * @param command - The command to check
   * @param selectedGroup - The selected group
   * @returns boolean
   */
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

  /**
   * Sorts the commands by featured first
   *
   * @private
   * @param commands - The commands to sort
   * @returns commandEntry[]
   */
  private sortByFeaturedFirst(commands: commandEntry[]): commandEntry[] {
    return commands.sort((a, b) => {
      const aFeatured = this.featuredCommandIds.has(a.id)
      const bFeatured = this.featuredCommandIds.has(b.id)
      if (aFeatured && !bFeatured) return -1
      if (!aFeatured && bFeatured) return 1
      return 0
    })
  }

  // Refreshing  ------------------------ //

  /**
   * Refreshes the commands
   *
   * @returns void
   */
  public refreshCommands() {
    this.loadCommands()
  }
}
