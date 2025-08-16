import type { App, Command, Plugin } from 'obsidian'
import type {
  hotkeyEntry,
  UnsafeInternalPlugin,
  commandEntry,
} from '../../interfaces/Interfaces'
import HotkeyManager from '../hotkeyManager'
import SettingsManager, { type CGroup } from '../settingsManager'
import {
  convertModifiers,
  areModifiersEqual,
  isKeyMatch,
  matchHotkey,
} from '../../utils/modifierUtils'
import { buildCommandEntry } from '../../utils/commandBuilder'
import type groupManager from '../groupManager'
import GroupManager, {
  DEFAULT_GROUP_NAMES,
  GroupType,
} from '../groupManager/groupManager.svelte.ts'
import type KeyboardAnalyzerPlugin from '../../main'
import { getSystemShortcutCommands } from '../../utils/systemShortcuts'

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
  // Subscribers for index change notifications (lightweight observer)
  private subscribers: Set<(index: Record<string, commandEntry>) => void> =
    $state(new Set())

  private constructor(app: App, plugin?: KeyboardAnalyzerPlugin) {
    this.app = app
    this.plugin = plugin as any
    this.hotkeyManager = HotkeyManager.getInstance(app)
    // Pass plugin through as any to tolerate undefined during early initialization
    this.settingsManager = SettingsManager.getInstance(plugin as any)
    this.groupManager = GroupManager.getInstance(this.settingsManager)
    // Defer loading to an explicit initialize method
  }

  static getInstance(
    app: App,
    plugin?: KeyboardAnalyzerPlugin
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
    const allCommands = this.getCommands()
    this.commands = this.processCommands(allCommands)
    // Append virtual system/editor default shortcuts so they can be filtered/displayed
    const systemEntries = getSystemShortcutCommands()
    for (const entry of systemEntries) {
      this.commands[entry.id] = entry
    }
    // Notify any subscribers that the authoritative index changed
    try {
      this.notifySubscribers()
    } catch {
      // swallow notification errors
    }
  }

  /**
   * Returns all commands from the app
   *
   * @private
   * @returns Command[]
   */
  private getCommands(): Command[] {
    return Object.values(this.app.commands.commands)
  }

  /**
   * Processes the commands into a more usable format
   *
   * @private
   * @param commands - The commands to process
   * @returns Record<string, commandEntry>
   */
  private processCommands(commands: Command[]): Record<string, commandEntry> {
    // Use the centralized builder (static ES import) to ensure it's bundled and available at runtime
    return commands.reduce((acc, command) => {
      acc[command.id] = buildCommandEntry(
        this.app,
        this.hotkeyManager,
        command as any
      )
      return acc
    }, {} as Record<string, commandEntry>)
  }

  /**
   * Public read-only access to the authoritative commands index.
   * Consumers should prefer this over constructing their own view from app.commands.
   */
  public getCommandsIndex(): Record<string, commandEntry> {
    return this.commands
  }

  /**
   * Convenience: list view of the authoritative index
   */
  public getCommandsList(): commandEntry[] {
    return Object.values(this.commands)
  }

  /**
   * Ensure system shortcut virtual commands are present (idempotent).
   */
  public ensureSystemShortcutsLoaded(): void {
    const systemEntries = getSystemShortcutCommands()
    for (const entry of systemEntries) {
      this.commands[entry.id] = entry
    }
  }

  /**
   * Refresh the authoritative index from app.commands (rebuilds and notifies subscribers).
   */
  public refreshIndex(): void {
    this.loadCommands()
    this.notifySubscribers()
  }

  /**
   * Subscribe to index changes. Returns an unsubscribe function.
   */
  public subscribe(
    cb: (index: Record<string, commandEntry>) => void
  ): () => void {
    this.subscribers.add(cb)
    try {
      cb(this.getCommandsIndex())
    } catch {
      // swallow subscriber errors
    }
    return () => {
      this.subscribers.delete(cb)
    }
  }

  private notifySubscribers(): void {
    const index = this.getCommandsIndex()
    for (const cb of Array.from(this.subscribers)) {
      try {
        cb(index)
      } catch {
        // ignore subscriber failures
      }
    }
  }

  /**
   * Returns the name of the plugin for a given plugin ID
   *
   * @private
   * @param pluginId - The ID of the plugin to get the name of
   * @returns string - The name of the plugin
   */
  public getPluginName(pluginId: string): string {
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

  /**
   * Returns a boolean value indicating if a command is an internal module
   *
   * @param commandId - The ID of the command to check
   * @returns boolean
   */
  public isInternalModule(commandId: string): boolean {
    const pluginId = (commandId || '').split(':')[0] || ''

    // Known internal plugin IDs (core plugins)
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

    // Additional core namespaces used by Obsidian for built-in commands
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

    // Heuristic fallback: if not a community plugin and not an internal plugin id, treat as internal
    const isCommunity = Boolean(this.app.plugins.plugins[pluginId])
    if (isCommunity) return false
    const enabledInternal = this.app.internalPlugins.getEnabledPlugins()
    const isInternal = enabledInternal.some((p) => p.instance.id === pluginId)
    return isInternal || !isCommunity
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
      return Object.values(this.commands)
    }
    if (groupID === GroupType.Featured) {
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
    const next = new Set(this.featuredCommandIds)
    if (next.has(commandId)) next.delete(commandId)
    else next.add(commandId)
    this.featuredCommandIds = next
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
    // Get the filter settings for the selected group
    let filterSettings = this.groupManager.getGroupSettings(
      selectedGroupID || GroupType.All
    )

    if (selectedGroupID) {
      const selectedCommandGroup = this.groupManager.getGroup(selectedGroupID)

      filterSettings = selectedCommandGroup?.filterSettings || filterSettings
    }

    // Start with all commands for the selected group
    let commandsToFilter = this.getCommandsForGroup(selectedGroupID)

    // If there's no search and no active keys, we may still need to apply list-level filters
    // Apply filters unless none of them affect the list
    const hasListAffectingFilters =
      // Only with hotkeys
      !!filterSettings?.ViewWOhotkeys ||
      // Only custom hotkeys
      !!filterSettings?.OnlyCustom ||
      // Only duplicate hotkeys
      !!filterSettings?.OnlyDuplicates ||
      // Exclude internal modules when DisplayInternalModules is false
      filterSettings?.DisplayInternalModules === false
    if (
      !search &&
      activeModifiers.length === 0 &&
      !activeKey &&
      !hasListAffectingFilters
    ) {
      // Still respect FeaturedFirst even when no other list-affecting filters are active
      return filterSettings?.FeaturedFirst
        ? this.sortByFeaturedFirst(commandsToFilter)
        : commandsToFilter
    }

    const searchLower = search.toLowerCase()
    const hasActiveHotkeyQuery =
      (activeModifiers && activeModifiers.length > 0) || !!activeKey

    const filteredCommands = commandsToFilter.filter((command) => {
      if (!filterSettings) return true

      const nameMatch =
        searchLower.length === 0 ||
        `${command.pluginName} ${command.name} ${command.cmdName}`
          .toLowerCase()
          .includes(searchLower) ||
        (filterSettings.DisplayIDs &&
          command.id.toLowerCase().includes(searchLower))

      // Only apply hotkey matching when the user has an active hotkey query
      const hotkeyMatch = hasActiveHotkeyQuery
        ? command.hotkeys.some((hotkey) =>
            this.hotkeyMatches(
              hotkey,
              activeModifiers,
              activeKey,
              filterSettings.StrictModifierMatch || false
            )
          )
        : true

      // Only with hotkeys: when true → only include commands that have hotkeys
      const hasHotkeysMatch = filterSettings.ViewWOhotkeys
        ? command.hotkeys.length > 0
        : true

      // Internal modules visibility
      const internalModuleMatch = filterSettings.DisplayInternalModules
        ? true
        : !command.isInternalModule

      // System shortcuts visibility (virtual commands with pluginName 'System Shortcuts')
      const systemShortcutsMatch = filterSettings.DisplaySystemShortcuts
        ? true
        : command.pluginName !== 'System Shortcuts'

      // Only commands that have at least one user-set hotkey
      const onlyCustomMatch = filterSettings.OnlyCustom
        ? command.hotkeys.some((hk) => hk.isCustom)
        : true

      // Only commands that have at least one duplicate hotkey
      const onlyDuplicatesMatch = filterSettings.OnlyDuplicates
        ? command.hotkeys.some((hk) =>
            this.hotkeyManager.isHotkeyDuplicate(command.id, hk)
          )
        : true

      return (
        nameMatch &&
        hotkeyMatch &&
        hasHotkeysMatch &&
        internalModuleMatch &&
        systemShortcutsMatch &&
        onlyCustomMatch &&
        onlyDuplicatesMatch
      )
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
    const internalPlugins = this.app.internalPlugins.getEnabledPlugins()

    const internalPluginIDs = internalPlugins.map(
      (plugin) => plugin.manifest?.id || ''
    )

    const installedPlugins = Object.values(this.app.plugins.plugins)

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
      matchHotkey(hotkey, activeModifiers, activeKey, {
        strictModifierMatch: strictModifierMatch,
        allowKeyOnly: true,
        platformize: true,
      })
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
    return matchHotkey(hotkey, activeModifiers, activeKey, {
      strictModifierMatch: strictModifierMatch,
      allowKeyOnly: true,
      platformize: true,
    })
  }

  /**
   * Checks if a command matches a group
   * @param selectedGroup - The selected group
   * @returns commandEntry[]
   */
  public getCommandsForGroup(selectedGroupID?: string): commandEntry[] {
    if (!selectedGroupID || selectedGroupID === GroupType.All) {
      return Object.values(this.commands)
    }

    let group = this.groupManager.getGroup(selectedGroupID)

    if (!group) {
      return []
    }

    const groupCommands = (group.commandIds || [])
      .map((id) => this.commands[id])
      .filter(Boolean)
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
   * Simple name-based search across all commands.
   * - Matches against pluginName, name, cmdName, and id (lowercased contains).
   * - Excludes any ids present in options.excludeIds.
   * - Limits results to options.limit (default 20).
   */
  public searchCommandsByName(
    term: string,
    options?: { excludeIds?: Set<string>; limit?: number }
  ): commandEntry[] {
    const q = (term || '').trim().toLowerCase()
    if (!q) return []
    const exclude = options?.excludeIds || new Set<string>()
    const limit = options?.limit ?? 20

    const results: commandEntry[] = []
    for (const cmd of Object.values(this.commands)) {
      if (exclude.has(cmd.id)) continue
      const haystack =
        `${cmd.pluginName} ${cmd.name} ${cmd.cmdName} ${cmd.id}`.toLowerCase()
      if (haystack.includes(q)) {
        results.push(cmd)
        if (results.length >= limit) break
      }
    }
    return results
  }

  /**
   * Refreshes the commands
   *
   * @returns void
   */
  public refreshCommands() {
    this.loadCommands()
  }
}
