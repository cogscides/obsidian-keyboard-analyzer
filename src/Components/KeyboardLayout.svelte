<script lang="ts">
  import type { Key, Row, KeyboardInterface } from 'src/Interfaces'
  import { watchResize } from 'svelte-watch-resize'
  let wrapperWidth: number
  let wrapperHeight: number
  // @ts-ignore
  import Keyboard from 'svelte-keyboard'
  export let keyboardObject = 'standart'

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
  <Keyboard on:keydown={onKeydown} custom={keyboardObject} />
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
