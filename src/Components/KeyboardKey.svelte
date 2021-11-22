<script lang="ts">
  import type { Key, FreeSpace } from 'src/Interfaces'
  import { createEventDispatcher } from 'svelte'

  export let stringLabel: string
  export let xDivider: number = 0
  export let yDivider: number = 0

  export let keyObj: Key = {
    color: '#ccccc',
    label: '🍔',
    output: '🍔',
    width: 100,
    height: 100,
  }

  // export let freeSpace: FreeSpace

  const dispatch = createEventDispatcher()
  const handleClick = () => {
    dispatch('keyClick', keyObj)
  }
  // export let props: Key = {

  // }
</script>

{#if stringLabel}
  <div class="kb-layout-key small" id={stringLabel} on:click={handleClick}>
    {@html stringLabel}
  </div>
{:else if xDivider > yDivider}
  <div
    class="kb-divider"
    style="width: {xDivider * 24}px; height: {yDivider * 24}px"
  />
{/if}

<!-- <div class="kb-layout-key small" id={keyObj.label} on:click={handleClick}>
  {@html keyObj.label}
</div> -->
<style>
  .kb-layout-key {
    /* flex: 0 0 auto; */
    height: 3em;
    /* width: 100%; */
    flex-basis: 5.6%;
    white-space: nowrap;
    border-radius: 4px;
    /* min-width: 1rem !important; */
    color: var(--text-normal);
    /* background-color: var(--interactive-normal); */
    background-color: var(--background-modifier-border);
    margin-right: 0.3em;
    margin-bottom: 0.3em;
    padding-left: 1%;
    padding-right: 1%;
    /* margin: 0.4vh;*/
  }

  /* white-space: nowrap !important;
  text-shadow: 0 0 0.5vh #fff;
  border-radius: 0.5vh;
  width: 100%;
  text-align: center;
  line-height: 1em;
  color: #fff;
  background: radial-gradient(ellipse at center, #333 0%, #222 100%);
  margin: 0.4vh;
  padding-left: 1% !important;
  padding-right: 1% !important;
  white-space: nowrap !important; */

  /* flex: 0.5 1 20px; */
  /* height: 3em; */
  /* text-shadow: 0 0 0.5vh #fff; */
  /* border-radius: 0.5vh; */
  /* width: 100%; */
  /* line-height: 9vh; */
  /* background: radial-gradient(ellipse at center, #333 0%,#222 100%); */
  /* padding-right: auto; */

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
