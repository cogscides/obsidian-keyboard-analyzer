<!-- src/components/KeyboardKey.svelte -->
<script lang="ts">
  import type { Key } from '../interfaces/Interfaces'
  import { getContext } from 'svelte'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'

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
    'visualKeyboardManager',
  )
  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')

  let keyState = $derived(visualKeyboardManager.getKeyState(key))
  let displayLabel = $derived(keyState.displayValue)

  // let keyOutput = $derived(key.unicode || key.label)
  let smallText = $derived(key.smallText || false)

  let width = $derived(key.width || 1)
  let height = $derived(key.height || 1)

  function getColumnSpan(w: number) {
    return `span ${Math.max(1, Math.round(w * 4))}`
  }

  function getRowSpan(h: number) {
    return `span ${Math.max(1, Math.round(h))}`
  }

  function spreadWeights(weight: number) {
    const maxWeight = Math.max(
      ...Object.values(visualKeyboardManager.keyStates).map(
        (state) => state.weight || 0,
      ),
    )
    const step = maxWeight / maxWeightSteps
    return Math.min(Math.floor(weight / step) + 1, maxWeightSteps)
  }

  function calculateOpacity(weight: number): number {
    if (!weight) return 0
    const opacityStep = 100 / maxWeightSteps
    return Math.min(Math.round(weight * opacityStep), 100)
  }

  function handleClick(key: Key) {
    const keyIdentifier = key.code || key.label || ''
    ;(async () => {
      const { default: logger } = await import('../utils/logger')
      logger.debug('Clicked key:', keyIdentifier)
    })()

    activeKeysStore.handleKeyClick(keyIdentifier)

    // Update visual state based on new active keys
    visualKeyboardManager.updateVisualState(
      activeKeysStore.activeKey,
      activeKeysStore.activeModifiers,
    )
  }

  let previewing = false
  let hovered = false
  let storedKey = ''
  let altKeydownListener: ((e: KeyboardEvent) => void) | null = null
  let altReleaseListener: ((e: KeyboardEvent) => void) | null = null

  function startPreview() {
    if (!previewing) {
      storedKey = activeKeysStore.ActiveKey
      altReleaseListener = (e: KeyboardEvent) => {
        if (e.key === 'Alt' || e.key === 'AltGraph') {
          stopPreview(false)
        }
      }
      window.addEventListener('keyup', altReleaseListener)
    }
    previewing = true
    activeKeysStore.ActiveKey = key.code || key.label || ''
  }

  function stopPreview(restore = true) {
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

  function handleMouseEnter(event: MouseEvent) {
    hovered = true
    const isModifierKey = visualKeyboardManager.mapCodeToObsidianModifier(
      key.code || key.label || '',
    )

    if (!isModifierKey) {
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        startPreview()
      }
      altKeydownListener = (e: KeyboardEvent) => {
        if (
          hovered &&
          (e.key === 'Alt' || e.key === 'AltGraph') &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey
        ) {
          startPreview()
        }
      }
      window.addEventListener('keydown', altKeydownListener, true)
    }
  }

  function handleMouseLeave() {
    hovered = false
    if (previewing) {
      stopPreview()
    }
    if (altKeydownListener) {
      window.removeEventListener('keydown', altKeydownListener, true)
      altKeydownListener = null
    }
  }
</script>

{#if displayLabel === 'empty'}
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <button
    class="kb-layout-key"
    style={`grid-row: ${getRowSpan(height)}; grid-column: ${getColumnSpan(width)};`}
    class:empty={keyState.state === 'empty'}
    aria-label="Empty key"
    disabled
  />
{:else}
  <button
    class="kb-layout-key"
    data-key-id={key.code || displayLabel}
    data-weight={keyState.weight && spreadWeights(keyState.weight)
      ? spreadWeights(keyState.weight)
      : 0}
    class:is-active={keyState.state === 'active'}
    class:is-hover={keyState.state === 'hover'}
    class:has-hotkey={keyState.state === 'possible'}
    class:small-text={key.smallText}
    style={`grid-row: ${getRowSpan(height)}; grid-column: ${getColumnSpan(width)}; ${keyState.state === 'active' ? `background-color: var(--interactive-accent);` : (keyState.state === 'inactive' || keyState.state === 'possible') && keyState.weight ? `background-color: rgb(from var(--color-red) r g b / ${calculateOpacity(spreadWeights(keyState.weight))}%);` : ''}`}
    onclick={() => handleClick(key)}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  >
    {displayLabel}
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
