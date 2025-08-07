import { Platform, type Modifier } from 'obsidian'
import { UNIFIED_KEYBOARD_LAYOUT } from '../../Constants'
import type {
  KeyboardLayout,
  Key,
  KeyboardKeyState,
  KeyboardSection,
  commandEntry,
} from '../../interfaces/Interfaces'
import {
  convertModifier,
  getDisplayModifier,
  unconvertModifiers,
} from '../../utils/modifierUtils'

/**
 * The VisualKeyboardManager class is responsible for managing and processing the visual keyboard layout.
 * It provides methods for initializing the keyboard layout, calculating weights, and managing key states.
 *
 * @example
 * ```typescript
 * const visualKeyboardManager = new VisualKeyboardManager()
 * ```
 *
 * @class VisualKeyboardManager
 */
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
      keyWeights[key.toLowerCase()] = 0
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
          // Normalize modifier names into buckets that match visual keys
          let bucket: string | null = null
          if (modKey === 'mod') {
            bucket = Platform.isMacOS ? 'meta' : 'control'
          } else if (modKey === 'ctrl' || modKey === 'control') {
            bucket = 'control'
          } else if (modKey === 'cmd' || modKey === 'meta' || modKey === 'win') {
            bucket = 'meta'
          } else if (modKey === 'alt' || modKey === 'option') {
            bucket = 'alt'
          } else if (modKey === 'shift') {
            bucket = 'shift'
          }

          if (bucket) {
            keyWeights[bucket] = (keyWeights[bucket] || 0) + 1
          } else {
            keyWeights[modKey] = (keyWeights[modKey] || 0) + 1
          }
        }
      }
    }

    // Assign weights to keyStates
    for (const key in this.keyStates) {
      const lowerKey = key.toLowerCase()
      const code = this.keyStates[key].code?.toLowerCase() || ''
      // Map left/right modifier keys to their shared bucket
      if (code.startsWith('control')) {
        this.keyStates[key].weight = keyWeights['control'] || 0
      } else if (code.startsWith('alt')) {
        this.keyStates[key].weight = keyWeights['alt'] || 0
      } else if (code.startsWith('shift')) {
        this.keyStates[key].weight = keyWeights['shift'] || 0
      } else if (code.startsWith('meta')) {
        this.keyStates[key].weight = keyWeights['meta'] || 0
      } else {
        this.keyStates[key].weight = keyWeights[lowerKey] || 0
      }
    }

    // Debug log
    console.log('Key Weights:', keyWeights)
    console.log('Key States:', this.keyStates)
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

  public toggleKeyActive(keyIdentifier: string) {
    const stateKey = keyIdentifier.toLowerCase()
    if (this.keyStates[stateKey]) {
      this.keyStates[stateKey].state =
        this.keyStates[stateKey].state === 'active' ? 'inactive' : 'active'
      return this.keyStates[stateKey].state === 'active'
    } else {
      console.warn(
        `Key state for ${stateKey} is undefined. Check initialization.`
      )
      return false
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

  public updateVisualState(activeKey: string, activeModifiers: Modifier[]) {
    // Reset all keys to inactive
    for (const key in this.keyStates) {
      this.keyStates[key].state = 'inactive'
    }

    // Set active key
    if (activeKey) {
      const stateKey = activeKey.toLowerCase()
      if (this.keyStates[stateKey]) {
        this.keyStates[stateKey].state = 'active'
      }
    }

    // Get abstract names of active modifiers ('Control', 'Alt', etc.)
    const abstractActiveModifiers = new Set(unconvertModifiers(activeModifiers))

    // Set active state for modifier keys on the visual keyboard
    for (const key in this.keyStates) {
      const keyLabel = this.keyStates[key].code // e.g. 'ControlLeft'
      const abstractModifier = this.normalizeModifier(keyLabel) // returns 'Control'
      if (abstractModifier && abstractActiveModifiers.has(abstractModifier)) {
        this.keyStates[key].state = 'active'
      }
    }
  }

  // Helper function to be added to VisualKeyboardManager
  private normalizeModifier(keyIdentifier: string): string | null {
    if (!keyIdentifier) return null
    const lower = keyIdentifier.toLowerCase()
    if (lower.startsWith('control')) return 'Control'
    if (lower.startsWith('alt')) return 'Alt'
    if (lower.startsWith('shift')) return 'Shift'
    if (lower.startsWith('meta')) return 'Meta'
    return null
  }

  public clearActiveKeys() {
    for (const key in this.keyStates) {
      if (this.keyStates[key].state === 'active') {
        this.keyStates[key].state = 'inactive'
      }
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
