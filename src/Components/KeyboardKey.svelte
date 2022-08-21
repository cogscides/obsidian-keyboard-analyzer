<script lang="ts">
  import type { Key } from 'src/Interfaces'
  import { createEventDispatcher } from 'svelte'

  export let keyLabel: string = ''
  export let keyOutput: string = ''
  export let keyCode: number = -1
  export let keyWeight: number = 0
  export let smallText: boolean = false
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
    if (state !== 'disabled') {
      dispatch('kb-key-click', [keyCode, keyOutput])
    }
  }
</script>

{#if keyLabel === 'empty'}
  <div
    class="kb-layout-key empty"
    style:grid-column={width ? `span calc(${width}*4)` : 'span 4'}
  />
{:else}
  <div
    class="kb-layout-key"
    data-weight={keyWeight ? spreadWeights(keyWeight) : 0}
    data-key-id={keyCode}
    class:is-active={state === 'active'}
    class:small-text={smallText}
    style:grid-row={height !== 1 ? `span calc(${height}*1)` : 'span 1'}
    style:grid-column={width !== 1 ? `span calc(${width}*4)` : 'span 4'}
    on:click={handleClick}
  >
    {@html unicode && unicode !== '' ? unicode : keyLabel}
  </div>
{/if}

<style>
</style>
