import { ItemView } from 'obsidian'
import { mount, unmount } from 'svelte'

import Component from '../components/Example.svelte'

export const VIEW_TYPE_EXAMPLE = 'example-view'

export class ExampleView extends ItemView {
  component!: ReturnType<typeof mount> | null

  getViewType() {
    return VIEW_TYPE_EXAMPLE
  }

  getDisplayText() {
    return 'Example view'
  }

  async onOpen() {
    this.component = mount(Component, { target: this.contentEl })
  }

  async onClose() {
    if (this.component) {
      unmount(this.component)
      this.component = null
    }
  }
}
