import { Group } from 'lucide-svelte'
import type KeyboardAnalyzerPlugin from '../../main'
import {
  type PluginSettings,
  type FilterSettings,
  type CGroup,
  type CGroupFilterSettings,
  GroupType,
} from './settingsManager.d'

const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  StrictModifierMatch: true,
  ViewWOhotkeys: true,
  OnlyCustom: false,
  OnlyDuplicates: false,
  FeaturedFirst: false,
  HighlightCustom: false,
  HighlightDuplicates: false,
  DisplayIDs: false,
  GroupByPlugin: false,
  DisplayGroupAssignment: false,
  DisplayInternalModules: false,
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
}

export default class SettingsManager {
  private static instance: SettingsManager | null = null
  private plugin: KeyboardAnalyzerPlugin
  public settings: PluginSettings = $state(DEFAULT_PLUGIN_SETTINGS)

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
      this.settings = { ...DEFAULT_PLUGIN_SETTINGS, ...loadedData }
    } catch (error) {
      console.error('Failed to Plugin load settings:', error)
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await this.plugin.saveData(this.settings)
    } catch (error) {
      console.error('Failed to Plugin save settings:', error)
    }
  }

  updateSettings(newSettings: Partial<PluginSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  // Getters and setters for reactive properties
  get showStatusBarItem(): boolean {
    return this.settings.showStatusBarItem
  }

  set showStatusBarItem(value: boolean) {
    this.settings.showStatusBarItem = value
    this.saveSettings()
  }
}
