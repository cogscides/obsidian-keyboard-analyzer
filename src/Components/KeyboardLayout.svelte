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
  // export let app: App
  let measuredWidth: number
  let measuredHeight: number
  let isLowerThanReadable: boolean

  let value: Array<string> = ['one', 'two']

  // Keyboard
  let keyboardKeys = kb_layout_ansi104eng
  // console.log(keyboardKeys)

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
  const ReadableMaxWidthPX = getComputedStyle(
    document.querySelector(
      '.markdown-preview-view.is-readable-line-width .markdown-preview-sizer'
    )
  ).getPropertyValue('max-width')

  const ReadableMaxWidth = parseInt(ReadableMaxWidthPX, 10)

  // $: measuredWidth = keyboardDiv?.getBoundingClientRect()?.width
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
ReadableMaxWidth: {ReadableMaxWidthPX} <br />
Keyboard Widht: {measuredWidth} <br />
Keyboard Height: {measuredHeight} <br />
isLowerThan: {measuredWidth < ReadableMaxWidth ? true : false} <br />
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
