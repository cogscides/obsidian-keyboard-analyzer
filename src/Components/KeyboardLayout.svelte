<script lang="ts">
  import type { Key, Row, KeyboardInterface } from 'src/Interfaces'
  import { watchResize } from 'svelte-watch-resize'
  let wrapperWidth: number
  let wrapperHeight: number
  // @ts-ignore
  import Keyboard from 'svelte-keyboard'
  export let keyboardObj_qwerty: any = 'standart'
  export let keyboardObj_other: any = 'standart'
  export let keyboardObj_num: any = 'standart'

  // instance of Keyboard
  let Keyboard_qwerty: Keyboard = Keyboard
  let Keyboard_other: Keyboard = Keyboard
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
  <div id="keyboard-layout">
    <div id="keyboard-qwerty">
      <Keyboard_qwerty
        on:keydown={onKeydown}
        custom={keyboardObj_qwerty}
        id="keyboard-qwerty"
        --height="4vh"
        --border-radius="0"
        --background="#efefef"
        --flex="1"
        --flex-shrink="0"
        --flex-grow="1"
        --font-size="12px"
        --min-width="1vw"
        --margin="0.1rem"
        noSwap={['Shift']}
      />
    </div>
    <div id="keyboard-other">
      <Keyboard_other
        on:keydown={onKeydown}
        custom={keyboardObj_other}
        --height="4vh"
        --border-radius="0"
        --background="#efefef"
        --flex="1"
        --flex-shrink="0"
        --flex-grow="1"
        --font-size="12px"
        --min-width="1vw"
        --margin="0.1rem"
        noSwap={['Shift']}
      />
    </div>
    <div id="keyboard-num">
      <Keyboard_num
        on:keydown={onKeydown}
        custom={keyboardObj_num}
        --height="4vh"
        --border-radius="0"
        --background="#efefef"
        --flex="1"
        --flex-shrink="0"
        --flex-grow="1"
        --font-size="12px"
        --min-width="1vw"
        --margin="0.1rem"
        noSwap={['Shift']}
      />
    </div>
  </div>
</div>

// html of proportionally resizable keys in flexbox container



<!-- <Keyboard_numpad on:keydown={onKeydown} custom={keyboardObj_num} /> -->
<style>
  :global(.svelte-keyboard) {
    width: 100%;
    /* transform: scale(0.5); */
  }

  :global(.svelte-keyboard button.key--) {
    background: transparent;
  }

  :global(.svelte-keyboard button.key) {
    padding: 4px 0px;
    text-align: center;
  }

  #keyboard {
    padding: 0 5vw;
  }

  #keyboard-layout {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: 100%;
    justify-content: center;
  }

  #keyboard-qwerty {
    flex: 3;
  }

  #keyboard-other {
    flex: 1;
  }

  #keyboard-num {
    flex: 1;
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
</style>
