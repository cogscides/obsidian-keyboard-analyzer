<script lang="ts">
  import type { Key } from 'src/Interfaces'
  import { createEventDispatcher } from 'svelte'

  export let keyLabel: string = ''
  export let keyCode: number = -1
  export let keyWeight: number = 0
  export let width: number = 1
  export let height: number = 1
  export let unicode: string = ''
  // export let tryUnicode: boolean = false
  export let state: 'active' | 'inactive' | 'posible' | 'disabled' | 'empty'

  // spread weight into n=5 steps
  // for large key weights (e.g. ctrl when is could be 20+) and small key weights (e.g. "A" when is could be 1)
  // return a number between 1 and 5
  function spreadWeights(weight: number) {
    if (weight >= 5) {
      return 5
    } else if (weight < 5 && weight > 0) {
      return weight
    } else {
      return 0
    }
  }

  const dispatch = createEventDispatcher()
  const handleClick = () => {
    dispatch('keyClick', keyCode)
  }
</script>

{#if keyLabel === 'empty'}
  <div
    class="kb-layout-key empty"
    style:grid-column={width ? `span calc(${width}*4)` : 'span 4'}
  />
{:else}
  <div
    class="kb-layout-key small"
    weight={keyWeight ? spreadWeights(keyWeight) : 0}
    key-id={keyCode}
    class:is-active={state === 'active'}
    style:grid-row={height ? `span calc(${height}*1)` : 'span 1'}
    style:grid-column={width ? `span calc(${width}*4)` : 'span 4'}
    on:click={handleClick}
  >
    {@html unicode && unicode !== '' ? unicode : keyLabel}
  </div>
{/if}

<style>
  :root {
    --font-scale-0: 12px;
    --font-scale-0-5: 14px;
    --font-scale-1: 16px;
    --font-scale-2: 18px;
    --font-scale-3: 20px;
  }
  .kb-layout-key {
    border: 1px solid var(--indentation-guide);
    font-size: var(--font-scale-0);
    line-height: initial;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    border-radius: 4px;
    color: var(--text-normal);
    background-color: var(--background-primary);
  }
  .kb-layout-key.is-active {
    color: var(--text-accent);
    background-color: whitesmoke;
  }
  .kb-layout-key:hover {
    background-color: var(--background-primary-alt);
  }
  .kb-layout-key.empty {
    border: none;
    background-color: transparent;
  }
  /* key heatmap by weight */
  .kb-layout-key[weight='1'] {
    background-color: #f0bca469;
  }
  .kb-layout-key[weight='2'] {
    background-color: #e694846f;
  }
  .kb-layout-key[weight='3'] {
    background-color: #d96f6f84;
  }
  .kb-layout-key[weight='4'] {
    background-color: #c94f4f81;
  }
  .kb-layout-key[weight='5'] {
    background-color: #b932328e;
  }
</style>
