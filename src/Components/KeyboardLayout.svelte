<script lang="ts">
  import { watchResize } from 'svelte-watch-resize'

  // @ts-ignore
  import Keyboard from 'svelte-keyboard'
  export let keyboardObj_qwerty: any = 'standart'
  export let keyboardObj_other: any = 'standart'
  export let keyboardObj_num: any = 'standart'
  export let screenState: string = 'desktop'

  // instance of Keyboard
  let Keyboard_qwerty: Keyboard = Keyboard
  let Keyboard_other: Keyboard = Keyboard
  let Keyboard_num: Keyboard = Keyboard

  const onKeydown = (event: any) => {
    console.log(event.detail)
  }
</script>

<div id="keyboard" class={screenState}>
  <div id="keyboard-layout">
    <div id="keyboard-qwerty">
      <Keyboard_qwerty
        on:keydown={onKeydown}
        custom={keyboardObj_qwerty}
        id="keyboard-qwerty"
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

<!-- <Keyboard_numpad on:keydown={onKeydown} custom={keyboardObj_num} /> -->
<style>
  :global(.svelte-keyboard) {
    width: 100%;
    height: 100%;
    /* transform: scale(0.5); */
  }

  :global(.svelte-keyboard button.key--) {
    background: transparent;
  }

  :global(.svelte-keyboard button.key--.active) {
    background: transparent;
  }

  :global(.svelte-keyboard button.key) {
    padding: 4px 0px;
    border-radius: 4px;
    font-size: 12px;
    height: 100%;
    text-align: center;
    color: var(--text-normal);
    background-color: var(--background-secondary-alt);
  }

  #keyboard {
    width: 100%;
  }

  #keyboard-layout {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: 100%;
    height: 100%;
    justify-content: center;
    margin: 0 auto;
    transition: width 2s;
  }

  :global(.svelte-keyboard .page.visible) {
    display: flex !important;
    flex-direction: column;
    height: 100%;
  }

  :global(.svelte-keyboard > .page) {
    display: block;
  }

  :global(.svelte-keyboard .page > .row) {
    height: 100%;
  }

  /* desktop adj */
  .desktop #keyboard-layout {
    max-width: 1280px;
    transition: max-width 1s;
  }

  #keyboard.desktop {
    height: 360px;
    transition: height 1s;
  }
  :global(#keyboard.desktop .row) {
    margin: 4px 0;
  }

  /* laptop adj */
  .laptop #keyboard-layout {
    max-width: 800px;
    transition: max-width 1s;
  }
  #keyboard.laptop {
    height: 280px;
    transition: height 1s;
  }
  :global(#keyboard.laptop .row) {
    margin: 2px 0;
  }

  /* mobile adj */
  .mobile #keyboard-layout {
    max-width: 100%;
    transition: max-width 1s;
  }

  #keyboard.mobile {
    height: 280px;
    transition: height 1s;
  }

  :global(#keyboard.mobile .row) {
    margin: 2px 0;
  }

  /* key groups */
  #keyboard-qwerty {
    flex: 3;
  }

  #keyboard-other {
    flex: 1;
  }

  #keyboard-num {
    flex: 1;
  }

  /* rows */
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
