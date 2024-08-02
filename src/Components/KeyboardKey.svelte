<!-- src/components/KeyboardKey.svelte -->
<script lang="ts">
  import type { Key } from '../interfaces/Interfaces'
  import { getContext } from 'svelte'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardManager.svelte'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'

  interface Props {
    key: Key
    keyLabel: string
  }

  let {
    key = {
      label: '',
      unicode: '',
      width: 1,
      height: 1,
    },
    keyLabel,
  }: Props = $props()

  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager'
  )
  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')

  let keyState = $derived(visualKeyboardManager.getKeyState(key))

  let displayLabel = $derived(keyState.output || keyLabel || key.label)
  let keyOutput = $derived(key.unicode || key.label)
  let smallText = $derived(key.smallText || false)
  let unicode = $derived(key.unicode || '')

  let width = $derived(key.width || 1)
  let height = $derived(key.height || 1)

  function getColumnSpan(w: number) {
    return `span ${Math.max(1, Math.round(w * 4))}`
  }

  function getRowSpan(h: number) {
    return `span ${Math.max(1, Math.round(h))}`
  }

  function spreadWeights(weight: number) {
    return Math.min(Math.max(weight, 0), 5)
  }

  function handleClick(key: Key) {
    // Pass the key's code instead of its label
    activeKeysStore.handleKeyClick(key.code || key.label)
  }
</script>

{#if keyLabel === 'empty'}
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <button
    class="kb-layout-key empty"
    style:grid-column={getColumnSpan(width)}
  />
{:else}
  <button
    class="kb-layout-key"
    data-key-id={key.code || keyLabel}
    data-weight={keyState.weight ? spreadWeights(keyState.weight) : 0}
    class:is-active={keyState.state === 'active'}
    class:has-hotkey={keyState.state === 'possible'}
    class:small-text={key.smallText}
    style={`grid-row: ${getRowSpan(height)}; grid-column: ${getColumnSpan(width)};`}
    onclick={() => {
      handleClick(key)
    }}
  >
    {displayLabel}
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
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .kb-layout-key.has-hotkey {
    border-color: var(--interactive-accent);
  }

  .kb-layout-key.small-text {
    font-size: 10px;
  }

  .kb-layout-key[data-weight='1'] {
    background-color: rgba(var(--interactive-accent-rgb), 0.2);
  }
  .kb-layout-key[data-weight='2'] {
    background-color: rgba(var(--interactive-accent-rgb), 0.4);
  }
  .kb-layout-key[data-weight='3'] {
    background-color: rgba(var(--interactive-accent-rgb), 0.6);
  }
  .kb-layout-key[data-weight='4'] {
    background-color: rgba(var(--interactive-accent-rgb), 0.8);
  }
  .kb-layout-key[data-weight='5'] {
    background-color: rgba(var(--interactive-accent-rgb), 1);
  }
</style>
