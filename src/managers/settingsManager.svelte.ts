// settingsManager.ts
import type { PluginSettings, FilterSettings } from '../interfaces/Interfaces'
import { DEFAULT_PLUGIN_SETTINGS } from '../Constants'
import type KeyboardAnalyzerPlugin from '../main'

class SettingsManager {
  private static instance: SettingsManager | null = null
  settings: PluginSettings = $state(DEFAULT_PLUGIN_SETTINGS)
  private plugin: KeyboardAnalyzerPlugin

  private constructor(plugin: KeyboardAnalyzerPlugin) {
    this.plugin = plugin
  }

  static getInstance(plugin?: KeyboardAnalyzerPlugin): SettingsManager {
    if (!SettingsManager.instance) {
      if (!plugin) {
        throw new Error(
          'Plugin instance must be provided when creating SettingsManager'
        )
      }
      SettingsManager.instance = new SettingsManager(plugin)
    }
    return SettingsManager.instance
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_PLUGIN_SETTINGS,
      await this.plugin.loadData()
    )
  }

  async saveSettings(): Promise<void> {
    await this.plugin.saveData(this.settings)
  }

  updateFilterSettings(newFilterSettings: Partial<FilterSettings>): void {
    this.settings.filterSettings = {
      ...this.settings.filterSettings,
      ...newFilterSettings,
    }
    this.saveSettings()
  }

  toggleFeaturedFirst(): void {
    this.settings.filterSettings.FeaturedFirst =
      !this.settings.filterSettings.FeaturedFirst
    this.saveSettings()
  }

  public async resetSettings(): Promise<void> {
    this.settings = DEFAULT_PLUGIN_SETTINGS
    await this.saveSettings()
  }

  public getSettings(): Readonly<PluginSettings> {
    return this.settings
  }

  public updateSettings(newSettings: Partial<PluginSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  public getSetting<K extends keyof PluginSettings>(key: K): PluginSettings[K] {
    return this.settings[key]
  }

  public async setSetting<K extends keyof PluginSettings>(
    key: K,
    value: PluginSettings[K]
  ): Promise<void> {
    this.settings[key] = value
    await this.saveSettings()
  }
}

// export const settingsManager = SettingsManager.getInstance() // Export the singleton instance
export default SettingsManager // Export the class
