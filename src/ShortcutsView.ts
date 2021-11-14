import { ItemView, WorkspaceLeaf } from 'obsidian'
import type KeyboardAnalizerPlugin from 'src/main'
import KeyboardAnalizerSettings from 'src/main'
// import { openOrSwitch } from 'obsidian-community-lib'
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from 'src/Constants'
import KeyboardComponent from './Components/KeyboardComponent.svelte'

export default class ShortcutsView extends ItemView {
  private plugin: KeyboardAnalizerPlugin
  private component: KeyboardComponent

  constructor(leaf: WorkspaceLeaf, plugin: KeyboardAnalizerPlugin) {
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

  icon = 'keyboard-glyph'

  async onOpen(): Promise<void> {
    await this.draw()
  }

  onClose(): Promise<void> {
    return Promise.resolve()
  }

  async draw(): Promise<void> {
    const { app, contentEl } = this
    const { settings } = this.plugin

    contentEl.empty()
    contentEl.addClass('KB-view')
    contentEl.addClass('markdown-preview-view')
    contentEl.addClass('is-readable-line-width')

    // this.component?.$destroy()

    this.component = new KeyboardComponent({
      target: contentEl,
      props: {
        app,
        plugin: this.plugin,
        settings,
        view: this,
      },
    })
  }
}
