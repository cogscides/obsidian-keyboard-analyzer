import { Platform, type Modifier } from 'obsidian'
import { getEmulatedOS } from '../../utils/runtimeConfig'
import { KEYBOARD_LAYOUTS, UNIFIED_KEYBOARD_LAYOUT } from '../../Constants'
import type {
  KeyboardLayout,
  Key,
  KeyboardKeyState,
  KeyboardSection,
  commandEntry,
} from '../../interfaces/Interfaces'
import { convertModifier, getDisplayModifier, unconvertModifiers } from '../../utils/modifierUtils'
import logger from '../../utils/logger'

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
  // Helper map for OS-aware modifier roles by event.code
  private codeToObsidianModifier: Record<string, 'Control' | 'Alt' | 'Shift' | 'Meta'> = {}

  constructor() {
    this.layout = this.getProcessedLayout(UNIFIED_KEYBOARD_LAYOUT)
    this.initializeKeyStates()
  }

  private getProcessedLayout(src: KeyboardLayout): KeyboardLayout {
    // Deep-clone lightweight structure
    const layout: KeyboardLayout = {
      sections: src.sections.map((section) => ({
        name: section.name,
        gridRatio: section.gridRatio,
        rows: section.rows.map((row) => row.map((k) => ({ ...k }))),
      })),
    }

    const emu = getEmulatedOS()
    const isMac = emu === 'macos' ? true : emu === 'none' ? Platform.isMacOS : false
    const os: 'macos' | 'windows' | 'linux' = isMac ? 'macos' : emu === 'linux' ? 'linux' : 'windows'
    // Apply per-OS key config at key level and assign modifier roles
    for (const section of layout.sections) {
      for (const row of section.rows) {
        for (const key of row) {
          if (!key || !key.code) continue
          const cfg = key.os?.[os]
          if (cfg) {
            if (cfg.label) key.label = cfg.label
            if (cfg.code) key.code = cfg.code
            if (cfg.unicode) key.unicode = cfg.unicode
            if (typeof cfg.modifier !== 'undefined') key.logicalModifier = cfg.modifier
          }
          // Fallback derive modifier by code + OS if not specified
          if (typeof key.logicalModifier === 'undefined') {
            const lc = (key.code || '').toLowerCase()
            if (lc.startsWith('control')) key.logicalModifier = 'Control'
            else if (lc.startsWith('alt')) key.logicalModifier = 'Alt'
            else if (lc.startsWith('shift')) key.logicalModifier = 'Shift'
            else if (lc.startsWith('meta')) key.logicalModifier = isMac ? 'Meta' : undefined
          }
        }
      }
    }
    return layout
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
              // Populate code→modifier mapping for OS-aware handling
              if (key.code) this.assignModifierRole(key)
              } else {
                logger.warn('Invalid key found:', key)
              }
          }
        })
      })
    })
  }

  private assignModifierRole(key: Key) {
    const code = key.code || ''
    const role = key.logicalModifier
    if (!role) {
      delete this.codeToObsidianModifier[code]
      return
    }
    this.codeToObsidianModifier[code] = role
  }

  public mapCodeToObsidianModifier(codeOrLabel: string): ('Control' | 'Alt' | 'Shift' | 'Meta') | undefined {
    // Prefer direct code lookup
    if (this.codeToObsidianModifier[codeOrLabel]) return this.codeToObsidianModifier[codeOrLabel]
    // Try normalized by capitalized code form
    const norm = codeOrLabel
    if (this.codeToObsidianModifier[norm]) return this.codeToObsidianModifier[norm]
    // Handle common code names
    if (/^Control(Left|Right)$/.test(codeOrLabel)) return 'Control'
    if (/^Alt(Left|Right)$/.test(codeOrLabel)) return 'Alt'
    if (/^Shift(Left|Right)$/.test(codeOrLabel)) return 'Shift'
    if (/^Meta(Left|Right)$/.test(codeOrLabel)) {
      const emu = getEmulatedOS()
      const isMac = emu === 'macos' ? true : emu === 'none' ? Platform.isMacOS : false
      return isMac ? 'Meta' : undefined
    }
    return undefined
  }

  private getUnicodeForKey(key: Key): string {
    if (!key) return ''
    // Prefer explicit unicode (possibly set via Key.os[os])
    if (key.unicode) return key.unicode
    const emu = getEmulatedOS()
    const isMac = emu === 'macos' ? true : emu === 'none' ? Platform.isMacOS : false
    if (isMac && key.mac_unicode) return key.mac_unicode
    if (!isMac && key.win_unicode) return key.win_unicode
    return key.label || ''
  }

  public calculateAndAssignWeights(visibleCommands: commandEntry[] | undefined | null) {
    const cmds = Array.isArray(visibleCommands) ? visibleCommands : []
    const keyWeights: Record<string, number> = {}

    // Initialize weights to 0
    for (const key in this.keyStates) {
      keyWeights[key.toLowerCase()] = 0
    }

    // Calculate weights
    for (const command of cmds) {
      const hkList = Array.isArray(command.hotkeys) ? command.hotkeys : []
      for (const hotkey of hkList) {
        const keyRaw = (hotkey.key || '').toLowerCase()
        const aliases = this.resolveKeyAliases(keyRaw)
        for (const alias of aliases) {
          if (alias in keyWeights) {
            keyWeights[alias] = (keyWeights[alias] || 0) + 1
            break
          }
        }
        const mods = Array.isArray(hotkey.modifiers) ? hotkey.modifiers : []
        for (const modifier of mods) {
          const modKey = modifier.toLowerCase()
          // Normalize modifier names into buckets that match visual keys
          let bucket: string | null = null
          const emu = getEmulatedOS()
          const isMac = emu === 'macos' ? true : emu === 'none' ? Platform.isMacOS : false
          if (modKey === 'mod') {
            bucket = isMac ? 'meta' : 'control'
          } else if (modKey === 'ctrl' || modKey === 'control') {
            bucket = 'control'
          } else if (modKey === 'cmd' || modKey === 'meta') {
            // When emulating Windows/Linux, treat 'cmd'/'meta' defaults as Control for weights
            bucket = isMac ? 'meta' : 'control'
          } else if (modKey === 'win') {
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

    // Optionally log with dev flag; disabled by default to reduce spam
    // logger.debug('Key Weights:', keyWeights)
    // logger.debug('Key States:', this.keyStates)
  }

  private resolveKeyAliases(k: string): string[] {
    // Try multiple representations to match state keys from layout
    const out = new Set<string>()
    const key = (k || '').toLowerCase()
    if (!key) return []
    out.add(key)
    // Symbol → code aliases used by layout
    const symbolToCode: Record<string, string> = {
      '`': 'backquote',
      '-': 'minus',
      '=': 'equal',
      '[': 'bracketleft',
      ']': 'bracketright',
      ';': 'semicolon',
      "'": 'quote',
      ',': 'comma',
      '.': 'period',
      '/': 'slash',
      '\\': 'backslash',
      ' ': 'space',
    }
    if (key in symbolToCode) out.add(symbolToCode[key])
    // code → symbol
    const codeToSymbol: Record<string, string> = Object.fromEntries(
      Object.entries(symbolToCode).map(([sym, code]) => [code, sym])
    )
    if (key in codeToSymbol) out.add(codeToSymbol[key])
    return Array.from(out)
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

    logger.warn(`Key state for ${stateKey} is undefined. Check initialization.`)
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
      logger.warn(`Key state for ${stateKey} is undefined. Check initialization.`)
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
      logger.warn(`Key state for ${stateKey} is undefined. Check initialization.`)
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

  // Preview a hotkey on hover using a distinct 'hover' state without clearing active states
  public previewHoverState(previewKey: string, previewModifiers: string[]) {
    // Clear previous hover states only
    for (const key in this.keyStates) {
      if (this.keyStates[key].state === 'hover') {
        this.keyStates[key].state = 'inactive'
      }
    }

    const lowerKey = (previewKey || '').toLowerCase()
    if (this.keyStates[lowerKey] && this.keyStates[lowerKey].state !== 'active') {
      this.keyStates[lowerKey].state = 'hover'
    }

    // Normalize incoming modifiers into abstract names used by normalizeModifier
    // previewModifiers might be display terms (e.g. 'Ctrl','Cmd'); map to abstract where possible
    const abstractMods = new Set(
      (previewModifiers || []).map((m) => convertModifier(m as unknown as Modifier))
    )

    for (const key in this.keyStates) {
      const code = this.keyStates[key].code
      const abstract = this.normalizeModifier(code)
      if (abstract && abstractMods.has(abstract as unknown as Modifier)) {
        if (this.keyStates[key].state !== 'active') {
          this.keyStates[key].state = 'hover'
        }
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
