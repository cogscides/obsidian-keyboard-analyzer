import { Platform } from 'obsidian'
import { UNIFIED_KEYBOARD_LAYOUT } from '../Constants'
import type {
  KeyboardLayout,
  Key,
  KeyboardKeyState,
  KeyboardSection,
  commandEntry,
} from '../interfaces/Interfaces'

export class VisualKeyboardManager {
  public layout: KeyboardLayout = $state(UNIFIED_KEYBOARD_LAYOUT)
  public keyStates: Record<string, KeyboardKeyState> = $state({})

  constructor() {
    this.initializeKeyStates()
  }

  private initializeKeyStates() {
    this.layout.sections.forEach((section) => {
      section.rows.forEach((row) => {
        row.forEach((key) => {
          if (key?.label && key.label !== 'empty') {
            const stateKey = (key.code || key.label || '').toLowerCase()
            if (stateKey) {
              const keyState: KeyboardKeyState = {
                displayValue: this.getUnicodeForKey(key),
                code: key.code || key.label,
                state: 'inactive',
                smallText: key.smallText,
                weight: 0,
              }
              this.keyStates[stateKey] = keyState
            } else {
              console.warn('Invalid key found:', key)
            }
          }
        })
      })
    })
  }

  private getUnicodeForKey(key: Key): string {
    if (!key) return ''
    if (Platform.isMacOS && key.mac_unicode) {
      return key.mac_unicode
    } else if (!Platform.isMacOS && key.win_unicode) {
      return key.win_unicode
    }
    return key.unicode || key.label || ''
  }

  public calculateAndAssignWeights(visibleCommands: commandEntry[]) {
    const keyWeights: Record<string, number> = {}

    // Initialize weights to 0
    for (const key in this.keyStates) {
      keyWeights[key] = 0
    }

    // Calculate weights
    for (const command of visibleCommands) {
      for (const hotkey of command.hotkeys) {
        const key = hotkey.key.toLowerCase()
        if (key in keyWeights) {
          keyWeights[key]++
        }
        for (const modifier of hotkey.modifiers) {
          const modKey = modifier.toLowerCase()
          if (modKey in keyWeights) {
            keyWeights[modKey]++
          }
        }
      }
    }

    // Assign weights to keyStates
    for (const key in this.keyStates) {
      this.keyStates[key].weight = keyWeights[key] || 0
    }
  }

  public getKeyState(key: Key): KeyboardKeyState {
    const stateKey = key.code?.toLowerCase() ?? key.label.toLowerCase()
    if (this.keyStates[stateKey]) {
      return this.keyStates[stateKey]
    }

    if (key.label === 'empty') {
      return {
        displayValue: key.label,
        code: '',
        state: 'empty',
      }
    }

    console.warn(
      `Key state for ${stateKey} is undefined. Check initialization.`
    )
    return {
      displayValue: key.label,
      code: '',
      state: 'inactive',
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
