// hotkeyManager.ts
import type { App, Hotkey } from 'obsidian'
import { getHotkeysV2, isHotkeyDuplicate } from '../utils/hotkeyUtils'

class HotkeyManager {
  private app: App | undefined = $state()

  constructor(app: App) {
    this.app = app
  }

  getHotkeys() {
    if (!this.app) return
    return getHotkeysV2(this.app)
  }

  isHotkeyDuplicate(commandID: string, hotkey: Hotkey): boolean {
    if (!this.app) return false
    return isHotkeyDuplicate(commandID, hotkey, this.app)
  }
}

export default HotkeyManager
