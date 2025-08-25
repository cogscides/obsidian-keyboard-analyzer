import { PluginSettingTab, Setting } from 'obsidian'
import type KeyboardAnalyzerPlugin from './main'
import { setDevLoggingEnabled, setEmulatedOS } from './utils/runtimeConfig'
import type { PluginSettings } from './managers/settingsManager/settingsManager.d'

export default class KeyboardAnalyzerSettingTab extends PluginSettingTab {
  plugin: KeyboardAnalyzerPlugin

  constructor(plugin: KeyboardAnalyzerPlugin) {
    super(plugin.app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()
    containerEl.createEl('h2', { text: 'Keyboard Analyzer' })

    // Developer options gate
    new Setting(containerEl)
      .setName('Enable developer options')
      .setDesc('Show extra developer tools in the UI and settings.')
      .addToggle(toggle => {
        toggle.setValue(
          !!this.plugin.settingsManager.getSetting('enableDeveloperOptions')
        )
        toggle.onChange(value => {
          this.plugin.settingsManager.updateSettings({
            enableDeveloperOptions: value,
          })
          // No runtime effect needed besides re-render on Svelte side
        })
      })

    // Dev logging
    new Setting(containerEl)
      .setName('Developer logging')
      .setDesc('Enable verbose logging to the console for diagnostics.')
      .addToggle(toggle => {
        toggle.setValue(
          !!this.plugin.settingsManager.getSetting('devLoggingEnabled')
        )
        toggle.onChange(value => {
          this.plugin.settingsManager.updateSettings({
            devLoggingEnabled: value,
          })
          setDevLoggingEnabled(value)
        })
      })

    // Keyboard dev tooltips
    new Setting(containerEl)
      .setName('Keyboard key tooltips')
      .setDesc(
        'Show informative tooltips when hovering over keyboard keys. Useful for development and debugging.'
      )
      .addToggle(toggle => {
        toggle.setValue(
          !!this.plugin.settingsManager.getSetting('keyboardDevTooltipsEnabled')
        )
        toggle.onChange(value => {
          this.plugin.settingsManager.updateSettings({
            keyboardDevTooltipsEnabled: value,
          })
        })
      })

    // Emulated OS
    new Setting(containerEl)
      .setName('Emulated OS')
      .setDesc('Temporarily override OS to test modifier mapping.')
      .addDropdown(dropdown => {
        dropdown.addOption('none', 'None')
        dropdown.addOption('windows', 'Windows')
        dropdown.addOption('macos', 'macOS')
        dropdown.addOption('linux', 'Linux')
        dropdown.setValue(
          this.plugin.settingsManager.getSetting('emulatedOS') || 'none'
        )
        dropdown.onChange(value => {
          const os = (value as 'none' | 'windows' | 'macos' | 'linux') || 'none'
          this.plugin.settingsManager.updateSettings({ emulatedOS: os })
          setEmulatedOS(os)
        })
      })

    // Baked key display names (dev-facing toggle)
    new Setting(containerEl)
      .setName('Use baked key names')
      .setDesc(
        'Show human-friendly key names (e.g., Backspace, Up Arrow, Cmd). Turn off to debug raw keys/glyphs.'
      )
      .addToggle(toggle => {
        toggle.setValue(
          !!this.plugin.settingsManager.getSetting('useBakedKeyNames')
        )
        toggle.onChange(value => {
          this.plugin.settingsManager.updateSettings({
            useBakedKeyNames: value,
          })
        })
      })

    // Key listener scope (global only effective in 'On hold' mode)
    new Setting(containerEl)
      .setName('Key listener scope')
      .setDesc(
        'Restrict the active key listener to the Analyzer view, or allow it globally (global requires modifiers: On hold).'
      )
      .addDropdown(dropdown => {
        dropdown.addOption('activeView', 'Active view only')
        dropdown.addOption('global', 'Global')
        const currentScope =
          this.plugin.settingsManager.getSetting('keyListenerScope') ||
          'activeView'
        dropdown.setValue(currentScope)
        dropdown.onChange(value => {
          const scope = (value as 'activeView' | 'global') || 'activeView'
          const mode =
            this.plugin.settingsManager.getSetting('modifierActivationMode') ||
            'click'
          if (scope === 'global' && mode !== 'press') {
            // Coerce to activeView to avoid confusing UX
            this.plugin.settingsManager.updateSettings({
              keyListenerScope: 'activeView',
            })
          } else {
            this.plugin.settingsManager.updateSettings({
              keyListenerScope: scope,
            })
          }
        })
      })

    // Modifier activation mode
    new Setting(containerEl)
      .setName('Modifier activation')
      .setDesc(
        'Choose how modifiers activate: On click (to add / remove) or On hold (select on hold, clears when released). Applies to modifiers only globally. Inside the Analyzer view, when the listener is active, you can select keys by clicking or by pressing keys; globally only modifiers are tracked.'
      )
      .addDropdown(dropdown => {
        dropdown.addOption('click', 'On click')
        dropdown.addOption('press', 'On hold')
        dropdown.setValue(
          this.plugin.settingsManager.getSetting('modifierActivationMode') ||
            'click'
        )
        dropdown.onChange(value => {
          const mode = (value as 'click' | 'press') || 'click'
          const scope =
            this.plugin.settingsManager.getSetting('keyListenerScope') ||
            'activeView'
          // If switching to click while scope is global, coerce scope to activeView
          const updates: Partial<PluginSettings> = {
            modifierActivationMode: mode,
          }
          if (mode === 'click' && scope === 'global') {
            updates.keyListenerScope = 'activeView'
          }
          this.plugin.settingsManager.updateSettings(updates)
        })
      })

    // Search debounce
    new Setting(containerEl)
      .setName('Search debounce (ms)')
      .setDesc('Delay before applying text filter changes.')
      .addText(text => {
        text.inputEl.type = 'number'
        text.setPlaceholder('200')
        text.setValue(
          String(
            this.plugin.settingsManager.getSetting('searchDebounceMs') ?? 200
          )
        )
        text.onChange(value => {
          const ms = Number(value)
          this.plugin.settingsManager.updateSettings({
            searchDebounceMs: Number.isFinite(ms) ? ms : 200,
          })
        })
      })
  }
}
