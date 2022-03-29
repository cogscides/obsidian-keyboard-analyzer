<script lang="ts">
  import type { Key, Row, Keyboard } from 'src/Interfaces'
  import KeyboardKey from './KeyboardKey.svelte'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount } from 'svelte'
  let wrapperWidth: number
  let wrapperHeight: number

  // export let keyboardKeys: any
  export let keyboardObject: Keyboard

  function KeyClick(e: any) {
    console.log(e.detail)
  }
</script>

<div
  id="keyboard"
  bind:offsetWidth={wrapperWidth}
  bind:offsetHeight={wrapperHeight}
  use:watchResize={(e) => {
    console.log(`resize`)
  }}
>
  {#each keyboardObject as row, i}
    <div
      class="kb-layout-row"
      alt="outer row"
      id={'Row-' + (+i + 1).toString()}
    >
      {#each row as entry}
          <KeyboardKey bind:keyObj={entry} on:keyClick={KeyClick} />
        <!-- {console.log(typeof entry)} -->
        <!-- {:else if typeof entry == Key}
          typeof Key -->
        <!-- {/if} -->
      {/each}
    </div>
  {/each}
</div>

<style>
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
</style>
