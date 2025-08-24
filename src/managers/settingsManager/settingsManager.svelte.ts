import type KeyboardAnalyzerPlugin from '../../main'
import logger from '../../utils/logger'
import {
  setDevLoggingEnabled,
  setEmulatedOS,
  setLogLevel,
  setKeyListenerScope,
  setModifierActivationMode,
  setSearchDebounceMs,
  setKeyboardDevTooltipsEnabled,
} from '../../utils/runtimeConfig'
import type { FilterSettings, PluginSettings } from './settingsManager.d'

const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  StrictModifierMatch: true,
  ViewWOhotkeys: true,
  OnlyCustom: false,
  OnlyDuplicates: false,
  FeaturedFirst: false,
  HighlightCustom: false,
  HighlightDuplicates: false,
  HighlightBuiltIns: false,
  DisplayIDs: false,
  ShowPluginBadges: true,
  GroupByPlugin: false,
  DisplayGroupAssignment: false,
  DisplayInternalModules: true,
  DisplaySystemShortcuts: false,
}

const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  showStatusBarItem: true,
  defaultFilterSettings: DEFAULT_FILTER_SETTINGS,
  filters: {
    isUnifiedAcrossGroups: false,
    filterSettings: DEFAULT_FILTER_SETTINGS,
  },
  featuredCommandIDs: [],
  commandGroups: [],
  lastOpenedGroupId: 'all',
  pinKeyboardPanel: false,
  keyboardCollapsed: false,
  enableDeveloperOptions: false,
  devLoggingEnabled: false,
  keyboardDevTooltipsEnabled: false,
  emulatedOS: 'none',
  useBakedKeyNames: true,
  allGroupOnOpen: 'default',
  // Keyboard listener behavior
  keyListenerScope: 'activeView',
  modifierActivationMode: 'click',
  searchDebounceMs: 200,
  // Persisted UI state
  quickViewHeight: 360,
  quickViewWidth: 420,
  quickViewAutoRun: true,
  settingsSchemaVersion: 1,
}

export default class SettingsManager {
  private static instance: SettingsManager | null = null
  private plugin: KeyboardAnalyzerPlugin
  public settings: PluginSettings = $state(DEFAULT_PLUGIN_SETTINGS)
  // Serialize and debounce saves to avoid partial writes and loops
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private saveInProgress = false
  private pendingAfterSave = false

  private constructor(plugin: KeyboardAnalyzerPlugin) {
    this.plugin = plugin
  }

  static getInstance(plugin: KeyboardAnalyzerPlugin): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager(plugin)
    }
    return SettingsManager.instance
  }

  // public get settings(): PluginSettings {
  //   return this.settings
  // }

  getSetting<K extends keyof PluginSettings>(key: K): PluginSettings[K] {
    return this.settings[key]
  }

  async loadSettings(): Promise<void> {
    try {
      const loadedData = await this.plugin.loadData()
      if (loadedData && typeof loadedData === 'object') {
        this.settings = { ...DEFAULT_PLUGIN_SETTINGS, ...loadedData }
      } else {
        // If file is empty or invalid, reset to defaults and persist to repair data.json
        this.settings = { ...DEFAULT_PLUGIN_SETTINGS }
        await this.plugin.saveData(this.settings)
      }

      // Migration: ensure settingsSchemaVersion exists and upgrade to v1
      const schemaVersion = Number(this.settings.settingsSchemaVersion ?? 0)
      if (!schemaVersion || schemaVersion < 1) {
        if (!Array.isArray(this.settings.commandGroups)) {
          this.settings.commandGroups = []
        }
        this.settings.settingsSchemaVersion = 1
        try {
          await this.plugin.saveData(this.settings)
        } catch {}
      }

      // Apply runtime flags from settings
      setDevLoggingEnabled(!!this.settings.devLoggingEnabled)
      setKeyboardDevTooltipsEnabled(!!this.settings.keyboardDevTooltipsEnabled)
      setEmulatedOS(
        (this.settings.emulatedOS || 'none') as
          | 'none'
          | 'windows'
          | 'macos'
          | 'linux'
      )
      setLogLevel('debug')
      // Apply keyboard behavior flags
      setKeyListenerScope(
        (this.settings.keyListenerScope || 'activeView') as
          | 'activeView'
          | 'global'
      )
      // Migrate legacy setting if present
      if (
        (this.settings as any).chordPreviewMode !== undefined &&
        this.settings.modifierActivationMode === undefined
      ) {
        this.settings.modifierActivationMode = (this.settings as any)
          .chordPreviewMode
          ? 'press'
          : 'click'
      }
      setModifierActivationMode(
        (this.settings.modifierActivationMode || 'click') as 'click' | 'press'
      )
      setSearchDebounceMs(Number(this.settings.searchDebounceMs ?? 200))
    } catch (error) {
      logger.error('Failed to Plugin load settings:', error)
      // Repair by writing defaults so Obsidian stops failing JSON.parse on next boot
      try {
        this.settings = { ...DEFAULT_PLUGIN_SETTINGS }
        await this.plugin.saveData(this.settings)
        logger.warn(
          'Settings file was invalid; wrote defaults to repair data.json'
        )
      } catch (saveErr) {
        logger.error(
          'Failed to write default settings after load error:',
          saveErr
        )
      }
    }
  }

  async saveSettings(): Promise<void> {
    // Expose direct save if needed, but try to prefer scheduleSave
    try {
      await this.plugin.saveData(this.settings)
    } catch (error) {
      logger.error('Failed to Plugin save settings:', error)
    }
  }

  private scheduleSave(delay = 150) {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      this.flushSaveQueue()
    }, delay)
  }

  private async flushSaveQueue() {
    if (this.saveInProgress) {
      // One more save after current finishes
      this.pendingAfterSave = true
      return
    }
    this.saveInProgress = true
    try {
      await this.plugin.saveData(this.settings)
    } catch (error) {
      logger.error('Failed to save settings (flush):', error)
    } finally {
      this.saveInProgress = false
      if (this.pendingAfterSave) {
        this.pendingAfterSave = false
        // Coalesce rapid updates into one final write
        this.scheduleSave(50)
      }
    }
  }

  /**
   * Public: Flush any pending debounced saves and serialize one final write.
   * Used on plugin unload to reduce chances of truncated JSON.
   */
  public async flushAllSaves(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    // If a save is already in progress, mark that we want one more and wait for the queue
    if (this.saveInProgress) {
      this.pendingAfterSave = true
      // Poll-wait up to ~1s for the in-flight save to finish, then the queued one to schedule
      const start = Date.now()
      while (this.saveInProgress && Date.now() - start < 1000) {
        await new Promise(r => setTimeout(r, 25))
      }
    }
    // Perform an immediate flush write
    try {
      await this.plugin.saveData(this.settings)
    } catch (err) {
      logger.error('Failed to flush settings on unload:', err)
    }
  }

  updateSettings(newSettings: Partial<PluginSettings>): void {
    // Shallow equality check to avoid redundant writes/rerenders
    let changed = false
    const next = { ...this.settings }
    for (const [k, v] of Object.entries(newSettings) as [
      keyof PluginSettings,
      unknown,
    ][]) {
      if (next[k] !== v) {
        // @ts-expect-error generic write into settings shape
        next[k] = v
        changed = true
      }
    }
    if (!changed) return
    this.settings = next
    // Update runtime flags when relevant settings change
    if ('devLoggingEnabled' in newSettings) {
      setDevLoggingEnabled(!!this.settings.devLoggingEnabled)
      logger.info(
        'Dev logging',
        this.settings.devLoggingEnabled ? 'enabled' : 'disabled'
      )
    }
    if ('keyboardDevTooltipsEnabled' in newSettings) {
      setKeyboardDevTooltipsEnabled(!!this.settings.keyboardDevTooltipsEnabled)
      logger.info(
        'Keyboard dev tooltips',
        this.settings.keyboardDevTooltipsEnabled ? 'enabled' : 'disabled'
      )
    }
    if ('emulatedOS' in newSettings) {
      setEmulatedOS(
        (this.settings.emulatedOS || 'none') as
          | 'none'
          | 'windows'
          | 'macos'
          | 'linux'
      )
      logger.info('Emulated OS set to', this.settings.emulatedOS || 'none')
    }
    // Live-apply keyboard behavior flags
    if ('keyListenerScope' in newSettings) {
      setKeyListenerScope(
        (this.settings.keyListenerScope || 'activeView') as
          | 'activeView'
          | 'global'
      )
    }
    if ('modifierActivationMode' in newSettings) {
      setModifierActivationMode(
        (this.settings.modifierActivationMode || 'click') as 'click' | 'press'
      )
    }
    if ('searchDebounceMs' in newSettings) {
      setSearchDebounceMs(Number(this.settings.searchDebounceMs ?? 200))
    }
    this.scheduleSave()
  }

  // Getters and setters for reactive properties
  get showStatusBarItem(): boolean {
    return this.settings.showStatusBarItem
  }

  set showStatusBarItem(value: boolean) {
    this.settings.showStatusBarItem = value
    this.scheduleSave()
  }
}
