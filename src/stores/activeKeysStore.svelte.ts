import type { Modifier, App } from 'obsidian'
import { Platform } from 'obsidian'
import { getEmulatedOS } from '../utils/runtimeConfig'
import {
  convertModifier,
  type ModifierKey,
  sortModifiers,
} from '../utils/modifierUtils'
import type { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte'
import HotkeyManager from '../managers/hotkeyManager/hotkeyManager.svelte'
import type { commandEntry } from '../interfaces/Interfaces'

export class ActiveKeysStore {
  private app: App
  private hotkeyManager: HotkeyManager
  private visualKeyboardManager: VisualKeyboardManager
  private recognizedModifiers: Set<ModifierKey> = new Set([
    'Control',
    'Shift',
    'Alt',
    'Meta',
    'Mod',
  ])

  activeKey = $state('')
  activeModifiers: Modifier[] = $state([])

  constructor(app: App, visualKeyboardManager: VisualKeyboardManager) {
    this.app = app
    this.hotkeyManager = HotkeyManager.getInstance(app)
    this.visualKeyboardManager = visualKeyboardManager
  }

  setActiveKey(key: string) {
    this.activeKey = key
  }

  clearActiveKey() {
    this.activeKey = ''
  }

  get ActiveKey() {
    return this.activeKey
  }

  set ActiveKey(key: string) {
    this.activeKey = key
  }

  get ActiveModifiers() {
    return this.activeModifiers
  }

  set ActiveModifiers(modifiers: Modifier[]) {
    // Ensure no duplicate modifiers (e.g., when 'Mod' and 'Ctrl' both map to 'Ctrl')
    this.activeModifiers = Array.from(new Set(modifiers))
  }

  get state() {
    return {
      activeKey: this.activeKey,
      activeModifiers: this.activeModifiers,
    }
  }

  set state(newState: { activeKey: string; activeModifiers: Modifier[] }) {
    this.activeKey = newState.activeKey
    this.activeModifiers = newState.activeModifiers
  }

  public reset() {
    this.activeKey = ''
    this.activeModifiers = []
  }

  public handleKeyClick(keyIdentifier: string) {
    // First, try OS-aware modifier mapping by code
    const obsidianModifier = this.visualKeyboardManager.mapCodeToObsidianModifier(keyIdentifier)
    if (obsidianModifier) {
      this.toggleModifier(obsidianModifier as unknown as ModifierKey)
      return
    }
    const normalizedKey = this.normalizeKeyIdentifier(keyIdentifier)
    if (this.isModifier(normalizedKey)) {
      this.toggleModifier(normalizedKey as ModifierKey)
    } else {
      this.activeKey = this.activeKey === normalizedKey ? '' : normalizedKey
    }
  }

  public handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (this.activeKey !== '') {
        this.activeKey = ''
      } else if (this.activeModifiers.length > 0) {
        this.activeModifiers.length = this.activeModifiers.length - 1
      }
      return
    }

    const keyCode = e.code
    this.handleKeyClick(keyCode)
  }

  private isModifier(key: string): key is ModifierKey {
    return this.recognizedModifiers.has(key as ModifierKey)
  }

  private toggleModifier(modifier: ModifierKey) {
    const obsidianModifier = convertModifier(modifier)
    const newModifiers = new Set(this.activeModifiers)

    if (newModifiers.has(obsidianModifier)) {
      newModifiers.delete(obsidianModifier)
    } else {
      newModifiers.add(obsidianModifier)
    }

    this.activeModifiers = Array.from(newModifiers)
  }

  private normalizeKeyIdentifier(keyIdentifier: string): string {
    const keyMap: { [key: string]: string } = {
      ControlLeft: 'Control',
      ControlRight: 'Control',
      AltLeft: 'Alt',
      AltRight: 'Alt',
      ShiftLeft: 'Shift',
      ShiftRight: 'Shift',
      // OS-specific mapping for Meta: on Windows/Linux treat as 'Win' (not an Obsidian modifier)
      MetaLeft: (() => {
        const emu = getEmulatedOS()
        const isMac = emu === 'macos' ? true : emu === 'none' ? Platform.isMacOS : false
        return isMac ? 'Meta' : 'Win'
      })(),
      MetaRight: (() => {
        const emu = getEmulatedOS()
        const isMac = emu === 'macos' ? true : emu === 'none' ? Platform.isMacOS : false
        return isMac ? 'Meta' : 'Win'
      })(),
    }
    return keyMap[keyIdentifier] || keyIdentifier
  }

  public getDisplayKey() {
    const keyState =
      this.visualKeyboardManager.keyStates[this.activeKey.toLowerCase()]
    if (keyState) {
      return keyState.displayValue
    }
    return this.activeKey.length === 1
      ? this.activeKey.toUpperCase()
      : this.activeKey
  }

  public filterCommands(search: string): commandEntry[] {
    return this.hotkeyManager.searchHotkeys(
      search,
      this.activeModifiers,
      this.activeKey
    )
  }

  sortedModifiers = $derived(sortModifiers(this.activeModifiers))
}

export default function createActiveKeysStore(
  app: App,
  visualKeyboardManager: VisualKeyboardManager
): ActiveKeysStore {
  return new ActiveKeysStore(app, visualKeyboardManager)
}
