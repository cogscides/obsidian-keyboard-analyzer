<!-- src/components/KeyboardKey.svelte -->
<script lang="ts">
  import type { Key } from '../interfaces/Interfaces'
  import { getContext } from 'svelte'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'

  interface Props {
    key: Key
    maxWeightSteps?: number
  }

  let {
    key = {
      label: '',
      unicode: '',
      width: 1,
      height: 1,
      type: 'empty',
    } as Key,
    maxWeightSteps = 5,
  }: Props = $props()

  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager'
  )
  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')
  const isListenerActive: (() => boolean) | undefined = getContext(
    'isPhysicalListenerActive'
  )

  let keyState = $derived(visualKeyboardManager.getKeyState(key))
  let _displayLabel = $derived(keyState.displayValue)

  // let keyOutput = $derived(key.unicode || key.label)
  let _smallText = $derived(key.smallText || false)

  let _width = $derived(key.width || 1)
  let _height = $derived(key.height || 1)

  function _getColumnSpan(w: number) {
    return `span ${Math.max(1, Math.round(w * 4))}`
  }

  function _getRowSpan(h: number) {
    return `span ${Math.max(1, Math.round(h))}`
  }

  function _spreadWeights(weight: number) {
    const maxWeight = Math.max(
      ...Object.values(visualKeyboardManager.keyStates).map(
        (state) => state.weight || 0
      )
    )
    const step = maxWeight / maxWeightSteps
    return Math.min(Math.floor(weight / step) + 1, maxWeightSteps)
  }

  function _calculateOpacity(weight: number): number {
    if (!weight) return 0
    const base = 10
    const step = (100 - base) / Math.max(1, maxWeightSteps - 1)
    return Math.min(Math.round(base + (weight - 1) * step), 100)
  }

  function _handleClick(key: Key) {
    const keyIdentifier = key.code || key.label || ''
    ;(async () => {
      const { default: logger } = await import('../utils/logger')
      logger.debug('Clicked key:', keyIdentifier)
    })()

    activeKeysStore.handleKeyClick(keyIdentifier)

    // Update visual state based on new active keys
    visualKeyboardManager.updateVisualState(
      activeKeysStore.activeKey,
      activeKeysStore.activeModifiers
    )
  }

  let previewing = false
  let hovered = false
  let storedKey = ''
  let altKeydownListener: ((e: KeyboardEvent) => void) | null = null
  let altReleaseListener: ((e: KeyboardEvent) => void) | null = null

  function _startPreview() {
    if (!previewing) {
      storedKey = activeKeysStore.ActiveKey
      altReleaseListener = (e: KeyboardEvent) => {
        if (e.key === 'Alt' || e.key === 'AltGraph') {
          // Match mouseleave behavior: restore previous active key
          _stopPreview(true)
        }
      }
      window.addEventListener('keyup', altReleaseListener)
    }
    previewing = true
    activeKeysStore.ActiveKey = key.code || key.label || ''
  }

  function _stopPreview(restore = true) {
    if (restore) {
      activeKeysStore.ActiveKey = storedKey
    } else {
      activeKeysStore.clearActiveKey()
      storedKey = ''
    }
    previewing = false
    if (altReleaseListener) {
      window.removeEventListener('keyup', altReleaseListener)
      altReleaseListener = null
    }
  }

  function _handleMouseEnter(event: MouseEvent) {
    hovered = true
    const isModifierKey = visualKeyboardManager.mapCodeToObsidianModifier(
      key.code || key.label || ''
    )

    if (!isModifierKey) {
      // If physical listener is active, disable Alt-hover preview to avoid UX conflicts
      if (isListenerActive?.()) {
        return
      }
      // Only Alt should trigger dynamic hovering; allow Alt combined with other modifiers
      if (event.altKey) {
        _startPreview()
      }
      altKeydownListener = (e: KeyboardEvent) => {
        if (isListenerActive?.()) return
        if (hovered && (e.key === 'Alt' || e.key === 'AltGraph')) {
          _startPreview()
        }
      }
      window.addEventListener('keydown', altKeydownListener, true)
    }
  }

  function _handleMouseLeave() {
    hovered = false
    if (previewing) {
      // On mouse leave, restore previous active key
      _stopPreview(true)
    }
    if (altKeydownListener) {
      window.removeEventListener('keydown', altKeydownListener, true)
      altKeydownListener = null
    }
  }
</script>

{#if _displayLabel === 'empty'}
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <button
    class="kb-layout-key"
    style={`grid-row: ${_getRowSpan(_height)}; grid-column: ${_getColumnSpan(_width)};`}
    class:empty={keyState.state === 'empty'}
    aria-label="Empty key"
    disabled
  />
{:else}
  <button
    class="kb-layout-key"
    data-key-id={key.code || _displayLabel}
    data-weight={keyState.weight && _spreadWeights(keyState.weight)
      ? _spreadWeights(keyState.weight)
      : 0}
    class:is-active={keyState.state === 'active'}
    class:is-hover={keyState.state === 'hover'}
    class:has-hotkey={keyState.state === 'possible'}
    class:small-text={key.smallText}
    style={`grid-row: ${_getRowSpan(_height)}; grid-column: ${_getColumnSpan(_width)}; ${keyState.state === 'active' ? `background-color: var(--interactive-accent);` : (keyState.state === 'inactive' || keyState.state === 'possible') && keyState.weight ? `background-color: rgb(from var(--color-red) r g b / ${_calculateOpacity(_spreadWeights(keyState.weight))}%);` : ''}`}
    onclick={() => _handleClick(key)}
    onmouseenter={_handleMouseEnter}
    onmouseleave={_handleMouseLeave}
  >
    {_displayLabel}
    <!-- <span class="debug-weight font-300 text-[10px]">{keyState.weight}</span> --var(--interactive-accent); -->
  </button>
{/if}

<style>
  .kb-layout-key {
    font-size: 12px;
    padding: 4px;
    text-align: center;
    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
    color: var(--text-normal);
    width: 100%;
    height: 100%;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .kb-layout-key:hover {
    background-color: var(--background-modifier-hover);
  }

  .kb-layout-key.is-active {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
    box-shadow: var(--button-shadow-active);
  }

  /* Distinct style for hover-previewed hotkeys (from commands list hover) */
  .kb-layout-key.is-hover {
    background-color: var(--background-modifier-form-field);
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 1px var(--interactive-accent);
    color: var(--text-normal);
  }

  .kb-layout-key.has-hotkey {
    border-color: var(--interactive-accent);
  }

  .kb-layout-key.empty {
    border: none;
    background-color: transparent;
  }

  .kb-layout-key.small-text {
    font-size: 10px;
  }

  /* .kb-layout-key[data-weight='1'] {
    background-color: hsl(var(--interactive-accent-hsl), 0.2);
  }
  .kb-layout-key[data-weight='2'] {
    background-color: hsl(var(--interactive-accent-hsl), 0.4);
  }
  .kb-layout-key[data-weight='3'] {
    background-color: hsl(var(--interactive-accent-hsl), 0.6);
  }
  .kb-layout-key[data-weight='4'] {
    background-color: hsl(var(--interactive-accent-hsl), 0.8);
  }
  .kb-layout-key[data-weight='5'] {
    background-color: hsl(var(--interactive-accent-hsl), 1);
  } */
</style>
