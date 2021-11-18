<script lang="ts">
  import { kb_layout_ansi104eng } from 'src/Constants'
  import type {
    KeyboardLayoutJSON,
    KeyProperty,
    KeyLiteral,
  } from 'src/Interfaces'
  import { createEventDispatcher } from 'svelte'

  export let value: string = ''
  export let styleProperty: string = ''

  const dispatch = createEventDispatcher()

  let keyboardKeys = kb_layout_ansi104eng
  console.log(keyboardKeys)
</script>

<div class="keyboard">
  <button>Hello</button>
  {#each keyboardKeys as row, i}
    <div class="kb-layout-row" id={'Row-' + (+i + 1).toString()}>
      {#each row as key}
        {#if typeof key === 'string'}
          {#if key.length == 0}
            <div class="kb-layout-key">{key}</div>
          {:else}
            <div class="kb-layout-key small" id={key}>{@html key}</div>
          {/if}
        {:else if key.w}
          <!-- <div class="kb-layout-divider" style="flex-grow: {key.w}">
            {key.w}
          </div> -->
          <!-- <KeyDividerComponent properties={key} /> -->
        {/if}
      {/each}
    </div>
  {/each}
</div>

<!-- <svg
  width="100%"
  height="100%"
  viewBox="0 0 1152 449"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
> -->
<style>
  /* .keyboard {
    width: calc(100% - 1.8vh);
    font-size: 3vh;
  } */

  .kb-layout-key {
    /* flex: 0 0 auto; */
    height: 3em !important;
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
    /* margin: 0.4vh;

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

  .kb-layout-row {
    width: 100%;
    /* height: 5vh; */
    height: auto;
    /* background-color: var(--background-primary); */
    display: flex;

    /* width: 100%;
    height: 3em;
    background: #0f0f0f;
    display: flex; */
  }

  /* .kb-layout-key {
    flex: 1 1 auto;
    height: 3em !important;
    min-width: 2em !important;
  } */

  .small {
    font-size: 75%;
    line-height: 1rem;
    text-align: left;
  }
</style>
