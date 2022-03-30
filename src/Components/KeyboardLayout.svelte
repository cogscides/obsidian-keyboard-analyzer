<script lang="ts">
  import type { Key, Row, KeyboardInterface } from 'src/Interfaces'
  import { watchResize } from 'svelte-watch-resize'
  let wrapperWidth: number
  let wrapperHeight: number
  // @ts-ignore
  import Keyboard from 'svelte-keyboard'
  export let keyboardObj_qwerty: any = 'standart'
  export let keyboardObj_num: any = 'standart'

  // instance of Keyboard
  let Keyboard_qwerty: Keyboard = Keyboard
  // let Keyboard_add: Keyboard
  let Keyboard_num: Keyboard = Keyboard

  const onKeydown = (event: any) => {
    console.log(event.detail)
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
  // resizable flex div of two keyboard blocks in full width
  <div
    id="KB-view"
    class="KB-view"
    style="display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%;"
  >
    <Keyboard_qwerty on:keydown={onKeydown} custom={keyboardObj_qwerty} />
    <Keyboard_num on:keydown={onKeydown} custom={keyboardObj_num} />
  </div>
</div>

<!-- <Keyboard_numpad on:keydown={onKeydown} custom={keyboardObj_num} /> -->
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
