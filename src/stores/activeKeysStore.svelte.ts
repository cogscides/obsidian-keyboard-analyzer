import type { Modifier, App } from 'obsidian'
import {
  convertModifiers,
  unconvertModifiers,
  getModifierInfo,
  sortModifiers,
  areModifiersEqual,
  isKeyMatch,
  modifiersToString,
  convertModifier,
} from '../utils/modifierUtils'
import type { VisualKeyboardManager } from '../managers/visualKeyboardManager.svelte'
import HotkeyManager from '../managers/hotkeyManager.svelte'
import type { commandEntry } from '../interfaces/Interfaces'

export class ActiveKeysStore {
  private app: App
  private hotkeyManager: HotkeyManager
  private visualKeyboardManager: VisualKeyboardManager
  private recognizedModifiers: Set<string>

  activeKey = $state('')
  activeModifiers: Modifier[] = $state([])

  constructor(app: App, visualKeyboardManager: VisualKeyboardManager) {
    this.app = app
    this.hotkeyManager = HotkeyManager.getInstance(app)
    this.visualKeyboardManager = visualKeyboardManager
    this.recognizedModifiers = getModifierInfo().recognized
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

  public handleKeyClick(keyCode: string) {
    let keyLabel = keyCode

    // Convert the key label to a modifier if applicable
    keyLabel = convertModifiers([keyLabel])[0]

    if (this.recognizedModifiers.has(keyLabel)) {
      this.toggleModifier(keyLabel as Modifier)
    } else {
      // Store the key code instead of the label
      this.activeKey = this.activeKey === keyCode ? '' : keyCode
    }
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
    if (this.activeModifiers.includes(convertModifier(modifier))) {
      this.activeModifiers = this.activeModifiers.filter(
        (mod) => mod !== modifier
      )
    } else {
      this.activeModifiers = convertModifiers([
        ...this.activeModifiers,
        modifier,
      ])
    }
  }

  public handlePhysicalKeyDown(e: KeyboardEvent) {
    let keyLabel = convertModifiers([e.key])[0]

    if (this.recognizedModifiers.has(keyLabel)) {
      this.toggleModifier(keyLabel)
    }
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
