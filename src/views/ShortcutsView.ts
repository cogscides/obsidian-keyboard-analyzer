import { ItemView, type WorkspaceLeaf } from 'obsidian'
import type KeyboardAnalyzerPlugin from '../main'
// @ts-ignore
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from '../Constants'
import KeyboardComponent from '../components/KeyboardComponent.svelte'
import { mount, unmount } from 'svelte'
import type { PluginSettings } from '../interfaces/Interfaces'

export default class ShortcutsView extends ItemView {
  private plugin: KeyboardAnalyzerPlugin
  private component: ReturnType<typeof mount> | null = null

  navigation = true

  constructor(leaf: WorkspaceLeaf, plugin: KeyboardAnalyzerPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  async onload(): Promise<void> {
    super.onload()
  }

  getViewType(): string {
    return VIEW_TYPE_SHORTCUTS_ANALYZER
  }

  getDisplayText(): string {
    return 'Keyboard Shortcuts'
  }

  async onOpen(): Promise<void> {
    await this.draw()
  }

  onClose(): Promise<void> {
    if (this.component) {
      unmount(this.component)
      this.component = null
    }
    return Promise.resolve()
  }

  async draw(): Promise<void> {
    const { app, contentEl } = this

    contentEl.empty()
    contentEl.setAttribute('id', 'KB-view')
    contentEl.style.padding = '0'

    this.component = mount(KeyboardComponent, {
      target: contentEl,
      props: {
        app,
        plugin: this.plugin,
        view: this,
      },
    })
  }

  // private async onSettingsChange(
  //   newSettings: Partial<PluginSettings>
  // ): Promise<void> {
  //   await this.plugin.updateSettings(newSettings)
  //   // Optionally, you can redraw the component or update specific parts
  //   // await this.draw();
  // }
}
