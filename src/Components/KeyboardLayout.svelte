<script lang="ts">
  import { kb_layout_ansi104eng } from 'src/Constants'
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

  let keyboardWidth: number
  let keyboardHeight: number

  let readableMaxWidthPX: string
  let readableMaxWidth: number
  let isLowerThanReadable: boolean

  let scaleFactor: number = 1

  let value: Array<string> = ['one', 'two']

  // Keyboard
  let keyboardKeys = kb_layout_ansi104eng

  // let scale = Math.min(
  //   availableWidth / contentWidth,
  //   availableHeight / contentHeight
  // )
  // console.log(app.vault.config)
  // console.log(readableWidth)

  function KeyClick(e: any) {
    console.log(e.detail)
  }

  // onMount(() => {
  // function getKbViewDom(dom: HTMLCollection) {
  //   for (let i = 0; i < dom.length; i++) {
  //     console.log(dom[i].children.item)
  //   }
  // }

  // getKbViewDom(view)

  // const view = document.getElementsByClassName(
  //   'view-content KB-view markdown-preview-view is-readable-line-width'
  // )[0].firstChild
  //   console.log(view)
  //   const style = getComputedStyle(view)
  //   // const readableWidth = style.maxWidth
  //   // const readableWidth = style
  //   // console.log(readableWidth)
  // })
  onMount(() => {
    readableMaxWidthPX = getComputedStyle(
      document.querySelector(
        '.markdown-preview-view.is-readable-line-width .markdown-preview-sizer'
      )
    ).getPropertyValue('max-width')
    readableMaxWidth = parseInt(readableMaxWidthPX, 10)
  })

  // $: keyboardWidth = keyboardDiv?.getBoundingClientRect()?.width
  // $: value = {}
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
ReadableMaxWidth: {readableMaxWidthPX} <br />
Keyboard Widht: {keyboardWidth} <br />
Keyboard Height: {keyboardHeight} <br />
isLowerThan: {keyboardWidth < readableMaxWidth ? true : false} <br />

wrapperW: {wrapperWidth} <br />
wrapperH: {wrapperHeight}<br />

<div
  class="scaleable-wrapper"
  id="scaleable-wrapper"
  bind:offsetWidth={wrapperWidth}
  bind:offsetHeight={wrapperHeight}
  use:watchResize={(e) => {
    console.log(`resize`)
    scaleFactor = Math.min(
      wrapperWidth / keyboardWidth,
      wrapperHeight / keyboardHeight
    )
    console.log(scaleFactor)
  }}
>
  <div
    class="keyboard"
    bind:offsetWidth={keyboardWidth}
    bind:offsetHeight={keyboardHeight}
    style="transform: translate(-50%, -50%) scale({scaleFactor})"
  >
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
  .keyboard {
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
  }

  .scaleable-wrapper {
    resize: both;
    position: relative;
    height: 38.2%;
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
