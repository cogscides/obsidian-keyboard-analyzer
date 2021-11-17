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
  {#each keyboardKeys as row}
    <div class="kb-layout-row">
      {#each row as key}
        {#if typeof key === 'string'}
          <button class="kb-layout-key">{key}</button>
        {:else if key.w != undefined}
          <div class="kb-layout-divider" style="flex-grow: {key.w}">
            {key.w}
          </div>
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
  .keyboard {
    width: calc(100% - 1.8vh);
    font-size: 3vh;
  }

  .keyboard > .button .kb-layout-key {
    white-space: nowrap;
    text-shadow: 0 0 0.5vh #fff;
    border-radius: 0.5vh;
    width: 100%;
    text-align: center;
    line-height: 9vh;
    color: #fff;
    background: radial-gradient(ellipse at center, #333 0%, #222 100%);
    margin: 0.4vh;
    padding-left: 1% !important;
    padding-right: 1% !important;

    /* flex: 0.5 1 20px; */
    /* height: 3em; */
    /* white-space: nowrap; */
    /* text-shadow: 0 0 0.5vh #fff; */
    /* border-radius: 0.5vh; */
    /* width: 100%; */
    /* line-height: 9vh; */
    /* background: radial-gradient(ellipse at center, #333 0%,#222 100%); */
    /* padding-right: auto; */
  }

  .kb-layout-row {
    width: 100%;
    height: 6vh;
    background: #0f0f0f;
    display: flex;
  }

  .kb-layout-key {
    flex: 1 1 auto;
    height: 3em;
  }

  .small {
    color: red;
  }
</style>
