import { UNIFIED_KEYBOARD_LAYOUT } from '../Constants'
import type {
  KeyboardLayout,
  Key,
  KeyboardKeyState,
  KeyboardSection,
} from '../interfaces/Interfaces'

export class VisualKeyboardManager {
  public layout: KeyboardLayout = UNIFIED_KEYBOARD_LAYOUT
  public keyStates: Record<string, KeyboardKeyState> = {}

  constructor() {
    this.initializeKeyStates()
  }

  private initializeKeyStates() {
    this.layout.sections.forEach((section) => {
      section.rows.forEach((row) => {
        row.forEach((key) => {
          if (key.label !== 'empty') {
            const stateKey = key.code?.toLowerCase() || key.label.toLowerCase()
            const keyState: KeyboardKeyState = {
              output: key.unicode ?? key.label,
              keyCode: key.code || '',
              state: 'inactive',
              smallText: key.smallText,
              unicode: key.unicode,
              weight: 0,
            }
            this.keyStates[stateKey] = keyState
          }
        })
      })
    })

    // Initialize special keys
    Object.entries(this.layout.specialKeys).forEach(([code, key]) => {
      const stateKey = code.toLowerCase()
      const keyState: KeyboardKeyState = {
        output: key.unicode ?? key.label,
        keyCode: key.code || '',
        state: 'inactive',
        unicode: key.unicode,
        weight: 0,
      }
      this.keyStates[stateKey] = keyState
    })
  }

  public getKeyState(key: Key): KeyboardKeyState {
    const stateKey = key.code?.toLowerCase() ?? key.label.toLowerCase()
    if (this.keyStates[stateKey]) {
      return this.keyStates[stateKey]
    }
    console.warn(
      `Key state for ${stateKey} is undefined. Check initialization.`
    )
    return {
      output: key.label,
      keyCode: '',
      state: 'inactive',
      weight: 0,
    }
  }

  public updateKeyState(
    keyLabel: string,
    isActive: boolean,
    hasHotkey: boolean,
    weight = 0
  ) {
    const stateKey = keyLabel.toLowerCase()
    if (this.keyStates[stateKey]) {
      this.keyStates[stateKey].state = isActive
        ? 'active'
        : hasHotkey
        ? 'possible'
        : 'inactive'
      this.keyStates[stateKey].weight = weight
    } else {
      console.warn(
        `Key state for ${stateKey} is undefined. Check initialization.`
      )
    }
  }

  public resetKeyStates() {
    for (const keyLabel in this.keyStates) {
      this.keyStates[keyLabel].weight = 0
      this.keyStates[keyLabel].state = 'inactive'
    }
  }
}

export default function createVisualKeyboardManager(): VisualKeyboardManager {
  return new VisualKeyboardManager()
}
