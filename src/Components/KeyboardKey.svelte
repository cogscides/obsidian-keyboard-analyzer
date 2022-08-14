<script lang="ts">
  import type { Key } from 'src/Interfaces'
  import { createEventDispatcher } from 'svelte'

  // export let stringLabel: string
  // export let xDivider: number = 0
  // export let yDivider: number = 0

  export let keyObj: Key

  // Key Defaults
  if (keyObj.label) {
    if (!keyObj.color) {
      keyObj.color = 'default-color'
    }
    if (!keyObj.width) {
      keyObj.width = 1
    }
    if (!keyObj.height) {
      keyObj.height = 1
    }
  }

  // Divider
  // if (keyObj.x && keyObj.y) {
  //   keyObj.color = 'default-color'
  //   keyObj.width = 1
  //   keyObj.height = 1
  // }

  const dispatch = createEventDispatcher()
  const handleClick = () => {
    dispatch('keyClick', keyObj)
  }
</script>

{#if keyObj.label}
  <div
    class="kb-layout-key small {keyObj.color ? keyObj.color : ''}"
    style={keyObj.width ? `flex-basis: calc(${keyObj.width}*5.6%)` : ''}
    id={keyObj.label}
    on:click={handleClick}
  >
    {@html keyObj.label}
  </div>
{:else if keyObj.x || keyObj.y}
  <div
    class="kb-divider"
    style="width: {keyObj.x * 12}px; height: {keyObj.y * 12}px"
  />
{/if}

<style>
  .kb-layout-key {
    height: 20px;
    width: 20px;
    white-space: nowrap;
    border-radius: 4px;
    color: var(--text-normal);
    background-color: var(--background-modifier-border);
    margin-right: 0.3em;
    margin-bottom: 0.3em;
    padding-left: 1%;
    padding-right: 1%;
  }

  .kb-layout-key:hover {
    /* background-color: var(--interactive-hover); */
    background-color: var(--interactive-accent);
    user-select: none;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
  }

  .small {
    font-size: 75%;
    line-height: 1rem;
    text-align: left;
  }
</style>
