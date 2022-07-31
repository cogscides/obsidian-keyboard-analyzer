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

  // special symbols
  $: specialClasses = { '': 'invisible' }

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
        noSwap={['Shift']}
      />
    </div>
    <div id="keyboard-other">
      <Keyboard_other
        on:keydown={onKeydown}
        keyClass={specialClasses}
        custom={keyboardObj_other}
        noSwap={['Shift']}
      />
    </div>
    <div id="keyboard-num">
      <Keyboard_num
        on:keydown={onKeydown}
        custom={keyboardObj_num}
        noSwap={['Shift']}
      />
    </div>
  </div>
</div>

<!-- <Keyboard_numpad on:keydown={onKeydown} custom={keyboardObj_num} /> -->
<style>
</style>
