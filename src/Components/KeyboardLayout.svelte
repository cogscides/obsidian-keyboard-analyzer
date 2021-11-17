<script lang="ts">
  import { kb_layout_ansi104eng } from 'src/Constants'
  import KeyDividerComponent from 'src/Components/KeyDividerComponent.svelte'
  import type {
    KeyboardLayoutJSON,
    KeyProperty,
    KeyLiteral,
  } from 'src/Interfaces'
  // import * as json from 'src/keyboard-layout-object.json'

  // console.log('get string')
  // console.log(kb_layout_ansi104eng)
  let keyboardLayoutJSON = kb_layout_ansi104eng

  // function jsonEscape(str: string) {
  //   return str
  //     .replace(/\n/g, '\\\\n')
  //     .replace(/\r/g, '\\\\r')
  //     .replace(/\t/g, '\\\\t')
  // }

  // console.log('then parse layout')
  // let keyboardLayoutJSON = JSON.parse(jsonEscape(kb_layout_ansi104eng))
  console.log(keyboardLayoutJSON)
</script>

<div>
  {#each keyboardLayoutJSON as row}
    <div class="kb-layout-row">
      {#each row as key}
        {#if typeof key === 'string'}
          <div class="kb-layout-key">{key}</div>
        {:else if key.w != undefined}
          <KeyDividerComponent properties={key} />
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
  .kb-layout-row {
    display: flex;
    width: 100%;
  }

  .kb-layout-key {
    flex: 1 1 auto;
    padding: 2px 4px;
    width: 1em;
    height: 1em;
    background-color: var(--background-color);
  }

  .small {
    color: red;
  }
</style>
