<script lang="ts">
  import type { Key, FreeSpace } from 'src/Interfaces'
  import { kb_layout_ansi104eng } from 'src/Constants'
  import KeyboardKey from './KeyboardKey.svelte'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount } from 'svelte'
  // import type {
  //   KeyboardLayoutJSON,
  //   KeyProperty,
  //   KeyLiteral,
  // } from 'src/Interfaces'

  let measuredWidth: number
  let measuredHeight: number

  let keyboardKeys = kb_layout_ansi104eng

  function generateKeyboardObject(keyboardString: string) {}

  // let selected: Array<string> = ['one', 'two']

  // Keyboard
  // console.log(keyboardKeys)

  function KeyClick(e: any) {
    console.log(e.detail)
  }
</script>

<!-- {#each value as selectedKey} -->
<!-- <button
    on:click={(e) => {
      console.log(e)
    }}
    >{selectedKey}
  </button> -->
<!-- {/each} -->

<br />
Keyboard Widht: {measuredWidth} <br />
Keyboard Height: {measuredHeight} <br />

<div
  class="keyboard"
  use:watchResize={(e) => {
    console.log('resize')
  }}
  bind:offsetWidth={measuredWidth}
  bind:offsetHeight={measuredHeight}
>
  {#each keyboardKeys as row, i}
    <div class="kb-layout-row" id={'Row-' + (+i + 1).toString()}>
      {#each row as entry}
        {#if typeof entry == 'string'}
          {#if entry}
            <KeyboardKey bind:stringLabel={entry} on:keyClick={KeyClick} />
          {/if}
        {:else if typeof entry == 'object'}
          <KeyboardKey bind:xDivider={entry.x} bind:yDivider={entry.y} />
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
