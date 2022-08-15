<script lang="ts">
  import { watchResize } from 'svelte-watch-resize'
  import type { Keyboard } from 'src/Interfaces'
  import { Key } from 'lucide-svelte'

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
        {#each Row as Key}
          {#if Key.label === 'empty'}
            <div
              class="kb-layout-key empty"
              style:grid-column={Key.width
                ? `span calc(${Key.width}*4)`
                : 'span 4'}
            />
          {:else}
            <!-- style:font={Key.fontSize === 'small' ? 'small' : 'normal'}
              style:font-variant-caps={Key.caps ? Key.caps : 'normal'} -->
            <div
              class="kb-layout-key small {Key.color ? Key.color : ''}"
              id={Key.label}
              style:grid-row={Key.height
                ? `span calc(${Key.height}*1)`
                : 'span 1'}
              style:grid-column={Key.width
                ? `span calc(${Key.width}*4)`
                : 'span 4'}
              on:click={handleClick}
            >
              {@html Key.label}
            </div>
          {/if}
        {/each}
      {/each}
    </div>
  {/each}
</div>

<!-- <Keyboard_numpad on:keydown={onKeydown} custom={keyboardObj_num} /> -->
<style>
  :root {
    --font-scale-0: 12px;
    --font-scale-0-5: 14px;
    --font-scale-1: 16px;
    --font-scale-2: 18px;
    --font-scale-3: 20px;
  }
  .kb-layout-key {
    font-size: var(--font-scale-0-5);
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    border-radius: 4px;
    color: var(--text-normal);
    background-color: var(--background-modifier-border);
  }
  .kb-layout-key:hover {
    background-color: var(--background-modifier-border-hover);
  }
  .kb-layout-key.empty {
    background-color: transparent;
  }
</style>
