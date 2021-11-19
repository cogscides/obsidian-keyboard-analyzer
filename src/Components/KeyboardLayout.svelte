<script lang="ts">
  import { kb_layout_ansi104eng } from 'src/Constants'
  import KeyboardKey from './KeyboardKey.svelte'
  // import type {
  //   KeyboardLayoutJSON,
  //   KeyProperty,
  //   KeyLiteral,
  // } from 'src/Interfaces'

  let value: Array<string> = ['one', 'two']

  // Keyboard
  let keyboardKeys = kb_layout_ansi104eng
  console.log(keyboardKeys)

  function KeyClick(e: any) {
    console.log(e.detail)
  }

  // $: value = {}
</script>

<div class="keyboard">
  {#each value as selectedKey}
    <!-- <button
      on:click={(e) => {
        console.log(e)
      }}
      >{selectedKey}
    </button> -->
  {/each}

  {#each keyboardKeys as row, i}
    <div class="kb-layout-row" id={'Row-' + (+i + 1).toString()}>
      {#each row as key}
        {#if typeof key === 'string'}
          {#if key.length == 0}
            <KeyboardKey bind:label={key} on:keyClick={KeyClick}
              >Zero{key}</KeyboardKey
            >
          {:else}
            <KeyboardKey bind:label={key} on:keyClick={KeyClick}
              >{key}</KeyboardKey
            >
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
