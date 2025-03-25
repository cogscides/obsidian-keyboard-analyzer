import type { Modifier, App } from 'obsidian'
import {
  convertModifier,
  getDisplayModifier,
  modifierMap,
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
    this.activeModifiers = modifiers
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
    console.log('==== Clicked key identifier:', keyIdentifier)

    const normalizedKey = this.normalizeKeyIdentifier(keyIdentifier)

    console.log('Normalized key:', normalizedKey)

    if (this.recognizedModifiers.has(normalizedKey as ModifierKey)) {
      this.toggleModifier(normalizedKey)
    } else {
      this.activeKey = this.activeKey === normalizedKey ? '' : normalizedKey
    }

    console.log('Active modifiers:', this.activeModifiers)
    console.log('Active key:', this.activeKey)
  }

  public handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (this.activeKey !== '') {
        this.activeKey = ''
      } else if (this.activeModifiers.length > 0) {
        this.activeModifiers = this.activeModifiers.slice(0, -1)
      }
      return
    }

    const keyCode = e.code
    this.handleKeyClick(keyCode)
  }

  private toggleModifier(modifier: string) {
    const obsidianModifier = convertModifier(modifier)
    const index = this.activeModifiers.indexOf(obsidianModifier)

    if (index !== -1) {
      this.activeModifiers = this.activeModifiers.filter(
        (mod) => mod !== obsidianModifier
      )
    } else {
      this.activeModifiers = [...this.activeModifiers, obsidianModifier]
    }
  }

  private normalizeKeyIdentifier(keyIdentifier: string): string {
    const keyMap: { [key: string]: string } = {
      ControlLeft: 'Control',
      ControlRight: 'Control',
      Control: 'Control',
      Ctrl: 'Control',
      // Add more mappings as needed
    }

    return keyMap[keyIdentifier] || keyIdentifier
  }

  public handlePhysicalKeyDown(e: KeyboardEvent) {
    // const keyLabel = this.normalizeKeyIdentifier(e.key)
    // if (this.recognizedModifiers.has(keyLabel)) {
    //   const modifierKey = convertModifier(keyLabel as ModifierKey)
    //   if (modifierKey) {
    //     this.toggleModifier(modifierKey)
    //   }
    // }
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
