<script lang="ts">
  import { watchResize } from 'svelte-watch-resize'
  import type { Keyboard } from 'src/Interfaces'

  // @ts-ignore
  export let KeyboardObject: Keyboard

  // special symbols
  $: specialClasses = { '': 'invisible' }

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const label = target.id
    console.log(label)
  }

  const onKeydown = (event: any) => {
    console.log(event.detail)
  }
</script>

<div id="keyboard-layout">
  {#each KeyboardObject as Section}
    <div class={Section.name}>
      {#each Section.rows as Row}
        {#each Row.keys as Key}
          <div
            class="kb-layout-key small {Key.color ? Key.color : ''}"
            id={Key.label}
            style:grid-column={Key.width
              ? `span calc(${Key.width}*2)`
              : 'span 2'}
            on:click={handleClick}
          >
            {@html Key.label}
          </div>
        {/each}
      {/each}
    </div>
  {/each}
  <div class="other">
    <div class="" style="width: 100%; height: 100%">---</div>
  </div>

  <div class="num">
    <div class="" style="width: 100%; height: 100%">---</div>
  </div>
</div>

<!-- <Keyboard_numpad on:keydown={onKeydown} custom={keyboardObj_num} /> -->
<style>
  .kb-layout-key {
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    border-radius: 4px;
    color: var(--text-normal);
    background-color: var(--background-modifier-border);
  }
</style>
