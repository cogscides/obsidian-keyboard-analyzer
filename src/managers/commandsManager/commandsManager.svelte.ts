import type {
  App,
  InternalPlugin,
  InternalPluginName,
  Command,
  Plugin,
} from 'obsidian-typings'
import type {
  hotkeyEntry,
  UnsafeInternalPlugin,
  UnsafeInternalPluginInstance,
  commandEntry,
} from '../../interfaces/Interfaces'
import type { UnsafeAppInterface } from '../../interfaces/Interfaces'
import HotkeyManager from '../hotkeyManager/hotkeyManager.svelte'
import SettingsManager, { GroupType, type CGroup } from '../settingsManager'
import {
  convertModifiers,
  areModifiersEqual,
  isKeyMatch,
} from '../../utils/modifierUtils'
import type groupManager from '../groupManager'
import GroupManager, {
  DEFAULT_GROUP_NAMES,
} from '../groupManager/groupManager.svelte'
import type KeyboardAnalyzerPlugin from '../../main'

/**
 * The CommandsManager class is responsible for managing and processing commands.
 * It provides methods for loading, filtering, and managing command groups.
 *
 * @class CommandsManager
 */
export default class CommandsManager {
  private static instance: CommandsManager | null = null
  private app: App
  private plugin: KeyboardAnalyzerPlugin
  private hotkeyManager: HotkeyManager
  private commands: Record<string, commandEntry> = {}
  // private commandGroups: Map<string, CommandGroup> = $state(new Map())
  private settingsManager: SettingsManager
  private groupManager: GroupManager
  public featuredCommandIds: Set<string> = $state(new Set())
  public recentCommandIds: string[] = []

  private constructor(app: App, plugin: KeyboardAnalyzerPlugin) {
    this.app = app
    this.plugin = plugin
    this.hotkeyManager = HotkeyManager.getInstance(app)
    this.settingsManager = SettingsManager.getInstance(plugin)
    this.groupManager = GroupManager.getInstance(this.settingsManager)
    // Defer loading to an explicit initialize method
  }

  static getInstance(
    app: App,
    plugin: KeyboardAnalyzerPlugin
  ): CommandsManager {
    if (!CommandsManager.instance) {
      CommandsManager.instance = new CommandsManager(app, plugin)
    }
    return CommandsManager.instance
  }

  public initialize() {
    this.loadCommands()
    this.loadFeaturedCommands()
  }

  /**
   * Loads all commands from the app and processes them into a more usable format
   *
   * @private
   * @returns void
   */
  private loadCommands() {
    console.log('Loading commands...')
    const allCommands = this.getCommands()
    console.log('Retrieved commands:', allCommands.length)
    this.commands = this.processCommands(allCommands)
    console.log('Processed commands:', Object.keys(this.commands).length)
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
  public isInternalModule(commandId: string): boolean {
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

  /**
   * Loads the featured commands from the settings
   *
   * @private
   * @returns void
   */
  private loadFeaturedCommands() {
    this.featuredCommandIds = new Set(
      this.settingsManager.getSetting('featuredCommandIDs') || []
    )
  }

  /**
   * Returns the commands in a group
   *
   * @param groupName - The name of the group to get the commands from
   * @returns commandEntry[]
   */
  public getGroupCommands(groupID: string): commandEntry[] {
    if (groupID === GroupType.All) {
      return Array.from(this.featuredCommandIds)
        .map((id) => this.commands[id])
        .filter(Boolean)
    }
    if (groupID === GroupType.Recent) {
      return this.recentCommandIds
        .map((id) => this.commands[id])
        .filter(Boolean)
    }

    const group = this.groupManager.getGroup(groupID)

    if (!group) return []
    return group.commandIds
      .map((id: string) => this.commands[id])
      .filter(Boolean)
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
    selectedGroupID?: string
  ): commandEntry[] {
    console.log(
      'filterCommands:',
      search,
      activeModifiers,
      activeKey,
      selectedGroupID
    )

    // Get the filter settings for the selected group
    let filterSettings = this.groupManager.getGroupSettings(
      selectedGroupID || GroupType.All
    )
    console.log('[KB] CommandsManager.filterCommands settings', {
      selectedGroupID,
      filterSettings,
    })

    if (selectedGroupID) {
      console.log('selectedGroupID', selectedGroupID)
      const selectedCommandGroup = this.groupManager.getGroup(selectedGroupID)
      console.log('selectedCommandGroup', selectedCommandGroup)

      filterSettings = selectedCommandGroup?.filterSettings || filterSettings
    }

    // Start with all commands for the selected group
    let commandsToFilter = this.getCommandsForGroup(selectedGroupID)
    console.log('commandsToFilter', commandsToFilter)

    // If no search and no active hotkeys, return all commands for the selected group
    if (!search && activeModifiers.length === 0 && !activeKey) {
      return commandsToFilter
    }

    const searchLower = search.toLowerCase()

    const filteredCommands = commandsToFilter.filter((command) => {
      if (!filterSettings) return true
      const logPrefix = '[KB] CommandsManager.filterCommands'
      // debug per-command (lightweight)
      // console.debug(logPrefix, { id: command.id, filterSettings })
      const nameMatch =
        `${command.pluginName} ${command.cmdName}`
          .toLowerCase()
          .includes(searchLower) ||
        (filterSettings?.DisplayIDs &&
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
          filterSettings?.StrictModifierMatch || false
        )
      )

      // "Only with hotkeys": when true → only include commands that have hotkeys
      const hasHotkeysMatch = filterSettings?.ViewWOhotkeys
        ? command.hotkeys.length > 0
        : true

      const internalModuleMatch = filterSettings?.DisplayInternalModules
        ? true
        : !command.isInternalModule

      return nameMatch && hotkeyMatch && hasHotkeysMatch && internalModuleMatch
    })

    if (filterSettings?.FeaturedFirst) {
      return this.sortByFeaturedFirst(filteredCommands)
    }

    return filteredCommands
  }

  // Helper functions  ------------------------ //

  /**
   * Get all enabled plugins including internal plugins
   *
   * @private
   * @returns {Plugin[]}
   */
  public getInstalledPluginIDs(): string[] {
    const internalPlugins = (
      this.app as UnsafeAppInterface
    ).internalPlugins.getEnabledPlugins() as InternalPlugin[]

    console.log('internalPlugins', internalPlugins)
    const internalPluginIDs = internalPlugins.map(
      (plugin) => plugin.manifest?.id || ''
    )

    const installedPlugins = Object.values(this.app.plugins.plugins)
    console.log('installedPlugins', installedPlugins)

    const installedPluginIDs = installedPlugins.map((plugin) => {
      return (plugin as Plugin).manifest?.id || ''
    })

    return [...internalPluginIDs, ...installedPluginIDs].filter(
      (id) => id !== ''
    )
  }

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
  public getCommandsForGroup(selectedGroupID?: string): commandEntry[] {
    console.log('Getting commands for group:', selectedGroupID)
    console.log('All commands:', Object.keys(this.commands).length)

    if (!selectedGroupID || selectedGroupID === GroupType.All) {
      console.log('Returning all commands:', Object.keys(this.commands).length)
      return Object.values(this.commands)
    }

    let group = this.groupManager.getGroup(selectedGroupID)
    console.log('Found group:', group)

    if (!group) {
      console.log('No group found, returning empty array')
      return []
    }

    const groupCommands = group.commandIds
      .map((id) => this.commands[id])
      .filter(Boolean)
    console.log('Group commands:', groupCommands.length)
    return groupCommands
  }

  /**
   * Checks if a command matches a group
   *
   * @private
   * @param command - The command to check
   * @param selectedGroupID - The selected group
   * @returns boolean
   */
  private matchesGroup(
    command: commandEntry,
    selectedGroupID?: string
  ): boolean {
    if (!selectedGroupID) return true
    if (selectedGroupID === GroupType.Featured) {
      return this.featuredCommandIds.has(command.id)
    }
    if (selectedGroupID === GroupType.Recent) {
      return this.recentCommandIds.includes(command.id)
    }

    const group = this.groupManager.getGroup(selectedGroupID)
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
    return [...commands].sort((a, b) => {
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
