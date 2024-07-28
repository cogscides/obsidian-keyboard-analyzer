<script lang="ts">
  import type { MouseEventHandler } from 'svelte/elements'
  import type { Key } from '../interfaces/Interfaces'

  interface Props {
    keyLabel: string
    keyOutput: string
    keyCode: number
    keyWeight: number
    smallText: boolean
    width: number | undefined
    height: number | undefined
    unicode: string
    state: 'active' | 'inactive' | 'posible' | 'disabled' | 'empty' | 'possible'
    onKeyClick: MouseEventHandler<HTMLDivElement>
  }

  let {
    keyLabel = '',
    keyOutput = '',
    keyCode = -1,
    keyWeight = 0,
    smallText = false,
    width = 1,
    height = 1,
    unicode = '',
    state = 'active',
    onKeyClick,
  }: Props = $props()

  // spread weight into n=5 steps
  // for large key weights (e.g. ctrl when is could be 20+) and small key weights (e.g. "A" when is could be 1)
  // return a number between 1 and 5
  function spreadWeights(weight: number) {
    if (weight >= 5) {
      return 5
    }
    if (weight < 5 && weight > 0) {
      return weight
    }
    return 0
  }
</script>

{#if keyLabel === 'empty'}
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div
    class="kb-layout-key empty"
    style:grid-column={width ? `span calc(${width}*4)` : 'span 4'}
  />
{:else}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="kb-layout-key"
    data-weight={keyWeight ? spreadWeights(keyWeight) : 0}
    data-key-id={keyCode}
    class:is-active={state === 'active'}
    class:small-text={smallText}
    style:grid-row={height !== 1 ? `span calc(${height}*1)` : 'span 1'}
    style:grid-column={width !== 1 ? `span calc(${width}*4)` : 'span 4'}
    onclick={onKeyClick}
  >
    {@html unicode && unicode !== '' ? unicode : keyLabel}
  </div>
{/if}

<style>
</style>
