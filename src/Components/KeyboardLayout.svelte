<script lang="ts">
  import type { Key, FreeSpace, Keyboard } from 'src/Interfaces'
  import KeyboardKey from './KeyboardKey.svelte'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount } from 'svelte'
  // import type {
  //   KeyboardLayoutJSON,
  //   KeyProperty,
  //   KeyLiteral,
  // } from 'src/Interfaces'
  let wrapperWidth: number
  let wrapperHeight: number

  // export let keyboardKeys: any
  export let keyboardObject: Keyboard

  // let selected: Array<string> = ['one', 'two']

  // Keyboard
  // console.log(keyboardKeys)

  // event key event with UID https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  // window.addEventListener(
  //   'keydown',
  //   function (event) {
  //     const p = document.createElement('p')
  //     someInput.textContent = `KeyboardEvent: key='${event.key}' | code='${event.code}'`
  //     document.getElementById('output').appendChild(someInput)
  //   },
  //   true
  // )

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

<div
  id="keyboard"
  bind:offsetWidth={wrapperWidth}
  bind:offsetHeight={wrapperHeight}
  use:watchResize={(e) => {
    console.log(`resize`)
    // scaleFactor = Math.min(
    //   wrapperWidth / keyboardWidth,
    //   wrapperHeight / keyboardHeight
    // )
    // console.log(scaleFactor)
  }}
>
  <!-- {#if keyboardKeys}
    <br />
    Keyboard Widht: {wrapperWidth} <br />
    Keyboard Height: {wrapperHeight} <br />

    {#if wrapperWidth >= 1281}
      Class: default
    {:else if wrapperWidth < 1281 && wrapperWidth >= 481}
      Class: tablet
    {:else if wrapperWidth < 481}
      Class: mobile
    {/if} -->
  <!-- {#each keyboardKeys as row, i}
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
    {/each} -->
  {#each keyboardObject as row, i}
    <div class="kb-layout-row" id={'Row-' + (+i + 1).toString()}>
      {#each row as entry}
        <KeyboardKey bind:keyObj={entry} on:keyClick={KeyClick} />
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

  /* .keyboard {
    width: 100%;
    height: 100%;
    padding: 50px;
    text-align: center;
    background: white;
    position: relative;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    transform-origin: center center;
  } */

  /* .scaleable-wrapper {
    resize: both;
    position: relative;
    height: 38.2%;
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
