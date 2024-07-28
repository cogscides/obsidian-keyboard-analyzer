import { sortModifiers } from '../utils/modifierUtils'
import { JavaSciptKeyCodes, SpecialSymbols } from '../Constants'

class ActiveKeysStore {
  activeKey = $state('')
  activeModifiers: string[] = $state([])

  get ActiveKey() {
    return this.activeKey
  }

  set ActiveKey(key: string) {
    this.activeKey = key
  }

  get ActiveModifiers() {
    return this.activeModifiers
  }

  set ActiveModifiers(modifiers: string[]) {
    this.activeModifiers = modifiers
  }

  get state() {
    return {
      activeKey: this.activeKey,
      activeModifiers: this.activeModifiers,
    }
  }

  set state(newState: { activeKey: string; activeModifiers: string[] }) {
    this.activeKey = newState.activeKey
    this.activeModifiers = newState.activeModifiers
  }

  public reset() {
    this.activeKey = ''
    this.activeModifiers = []
  }

  public handleModifierKeyDown(e: KeyboardEvent) {
    const handleModifier = (modifierKey: string) => {
      if (this.activeModifiers.includes(modifierKey)) {
        this.activeModifiers = this.activeModifiers.filter(
          (mod) => mod !== modifierKey
        )
      } else {
        this.activeModifiers = [...this.activeModifiers, modifierKey]
      }
    }

    if (e.getModifierState('Shift')) handleModifier('Shift')
    if (e.getModifierState('Alt')) handleModifier('Alt')
    if (e.getModifierState('Control')) handleModifier('Ctrl')
    if (e.getModifierState('Meta')) handleModifier('Meta')
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

    const clickedKeyJS = JavaSciptKeyCodes[e.keyCode]
    if (clickedKeyJS) {
      e.preventDefault()
      this.activeKey =
        clickedKeyJS.Code === `Numpad${clickedKeyJS.Key}`
          ? clickedKeyJS.Code
          : clickedKeyJS.Key
    }
  }

  public getDisplayKey() {
    return this.activeKey in SpecialSymbols
      ? SpecialSymbols[this.activeKey]
      : this.activeKey.length === 1
      ? this.activeKey.toUpperCase()
      : this.activeKey
  }

  sortedModifiers = $derived(sortModifiers(this.activeModifiers))
}

const activeKeysStore = new ActiveKeysStore()
export default activeKeysStore
