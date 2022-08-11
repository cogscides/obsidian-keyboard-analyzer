<script lang="ts">
  // TYPES
  import type { App, Hotkey, Command, Modifier } from 'obsidian'

  // EXTERNAL
  import { createEventDispatcher } from 'svelte'
  import { fly, fade, slide, blur } from 'svelte/transition'
  import {
    RefreshCw as RefreshIcon,
    Filter as FilterIcon,
    X as CrossIcon,
    CircleDot as CircleDotIcon,
  } from 'lucide-svelte'
  // @ts-ignore
  import { clickOutside } from 'svelte-use-click-outside'
  import { JavaSciptKeyCodes, SpecialSymbols } from 'src/Constants'

  // UTILS
  import { getConvertedModifiers, sortModifiers } from 'src/AppShortcuts'

  export let inputHTML: HTMLInputElement
  export let search: string = ''
  export let activeSearchModifiers: string[] = []
  export let activeSearchKey: string = ''
  // export let allCommandsCount: number = 0
  // export let allHotkeysCount: number = 0
  export let searchCommandsCount: number
  export let searchHotkeysCount: number

  export let keyboardListenerIsActive: boolean = false
  let filterIsOpen: boolean = false
  let refreshIsActive: boolean = false

  // on click clear button clear search
  const ClearSearch = () => {
    if (search === '') {
      activeSearchModifiers = []
      activeSearchKey = ''
    } else {
      search = ''
    }
  }

  // on click activate keyboard listener
  const ActivateKeyboardListener = () => {
    keyboardListenerIsActive = !keyboardListenerIsActive
    inputHTML.focus()
  }

  // EVENT DISPATHCHERs
  const dispatch = createEventDispatcher()

  // 1. refresh commands
  function sendRefreshCommands(e: any) {
    refreshIsActive = true
    // set animation timeout
    setTimeout(() => {
      refreshIsActive = false
    }, 1000)
    dispatch('refresh-commands')
    console.log('RefreshCommands sent to dispatcher')
  }

  // dispatch filter event on filters change
  // TODO

  // on focus modifier keydown event add to activeSearchModifiers array
  // if modifier is already in array remove it
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState
  const onModifierKeyDown = (e: KeyboardEvent) => {
    function pushModifier(modifier: string) {
      if (!activeSearchModifiers.includes(modifier)) {
        activeSearchModifiers.push(modifier)
        activeSearchModifiers = activeSearchModifiers
      }
    }

    function spliceModifier(modifier: Modifier) {
      // splice modifier from activeSearchModifiers array
      activeSearchModifiers.splice(activeSearchModifiers.indexOf(modifier), 1)
      activeSearchModifiers = activeSearchModifiers
    }

    if (
      keyboardListenerIsActive &&
      (e.getModifierState('Shift') ||
        e.getModifierState('Alt') ||
        e.getModifierState('Control'))
    ) {
      switch (e.key) {
        case 'Shift':
          if (activeSearchModifiers.includes('Shift')) {
            spliceModifier('Shift')
          } else {
            pushModifier('Shift')
          }
          break
        case 'Alt':
          if (activeSearchModifiers.includes('Alt')) {
            spliceModifier('Alt')
          } else {
            pushModifier('Alt')
          }
          break
        case 'Meta':
          // OSX ONLY
          if (activeSearchModifiers.includes('Meta')) {
            spliceModifier('Meta')
          } else {
            pushModifier('Meta')
          }
          break
        case 'Control':
          if (activeSearchModifiers.includes('Ctrl')) {
            spliceModifier('Ctrl')
          } else {
            pushModifier('Ctrl')
          }
          break
        default:
          // TODO: triggers if two modifiers are pressed at the same time
          console.log('unknown modifier: ', e.key)
          console.log('please report this to the developer')

          break
      }
      // return to stop event propagation
      return
    } else if (e.key === 'Escape') {
      if (keyboardListenerIsActive) {
        keyboardListenerIsActive = false
      } else if (keyboardListenerIsActive === false) {
        inputHTML.blur()
      }
    } else if (e.key === 'Backspace') {
      // TODO clear activeSearchKey
      if (
        keyboardListenerIsActive === true &&
        activeSearchKey !== 'Backspace'
      ) {
        e.preventDefault()
        activeSearchKey = 'Backspace'
      } else if (
        keyboardListenerIsActive === true &&
        activeSearchKey === 'Backspace'
      ) {
        e.preventDefault()
        activeSearchKey = ''
      } else if (keyboardListenerIsActive === false) {
        // TODO fix clearence of activeSearchKey
        if (search === '' || inputHTML.selectionStart === 0) {
          if (activeSearchKey !== '') {
            activeSearchKey = ''
          } else if (
            activeSearchKey === '' &&
            activeSearchModifiers.length > 0
          ) {
            activeSearchModifiers.pop()
            activeSearchModifiers = activeSearchModifiers
          }
        }
      }
    } else if (keyboardListenerIsActive === true) {
      // @ts-ignore
      if (!(e.keyCode in JavaSciptKeyCodes)) {
        activeSearchKey = 'Key' + e.keyCode.toString()
      } else if (activeSearchKey !== JavaSciptKeyCodes[e.keyCode].Key) {
        e.preventDefault()
        activeSearchKey = JavaSciptKeyCodes[e.keyCode].Key
      } else if (activeSearchKey === JavaSciptKeyCodes[e.keyCode].Key) {
        e.preventDefault()
        activeSearchKey = ''
      }
    }
  }
</script>

<div class="hotkey-settings-container" on:keydown={onModifierKeyDown}>
  <!-- <div class="hotkey-search-menu"> -->
  <div class="search-wrapper">
    <div class="modifiers-wrapper">
      {#if activeSearchModifiers.length > 0 || activeSearchKey !== null}
        {#each sortModifiers(activeSearchModifiers) as modifier}
          <kbd class="modifier">{modifier}</kbd>
        {/each}
        {#if activeSearchKey !== ''}
          <kbd class="modifier"
            >{activeSearchKey in SpecialSymbols
              ? SpecialSymbols[activeSearchKey]
              : activeSearchKey.length === 1
              ? activeSearchKey.toUpperCase()
              : activeSearchKey}</kbd
          >
        {/if}
      {/if}
    </div>
    <div class="hotkey-search-container">
      <input
        type="text"
        placeholder="Filter..."
        bind:value={search}
        bind:this={inputHTML}
      />
      <div class="meta-search-wrapper">
        <div
          class="keyboard-icon icon {keyboardListenerIsActive ? 'pulse' : ''}"
          aria-label={keyboardListenerIsActive
            ? '`Esc` to Deactivate'
            : `\`${getConvertedModifiers(['Mod'])[0]}+F\` to Activate`}
          on:click={ActivateKeyboardListener}
        >
          <CircleDotIcon size={20} />
        </div>
        <!-- <div class="meta-search-indicator pulse">
          <div class="inner-circle" />
        </div> -->
        <div class="clear-icon icon" on:click={ClearSearch}>
          <CrossIcon size={20} />
        </div>
        <!-- <div class="search-input-clear-button" on:click={ClearSearch} /> -->
      </div>
    </div>
  </div>
  <button
    id="hotkey-filter-button"
    class={filterIsOpen ? 'is-active' : ''}
    aria-label="Filter Commands"
    on:click={() => {
      // console.log('filter: ', filterIsOpen)
      filterIsOpen = !filterIsOpen
    }}
  >
    <FilterIcon size={16} />
  </button>
  {#if filterIsOpen}
    <div
      use:clickOutside={() =>
        // await timeout 40ms
        setTimeout(() => {
          if (filterIsOpen) {
            filterIsOpen = false
          }
        }, 40)}
      transition:slide
      class="popup-filter-menu-container {filterIsOpen ? 'is-open' : ''}"
    >
      <div transition:fade>
        <div class="popup-filter-menu-body-title">
          <div class="popup-filter-menu-body-title-text">
            Show Commands with the following hotkeys:
          </div>
          <div
            class="popup-filter-menu-body-title-clear"
            on:click={ClearSearch}
          />
        </div>
        <div class="popup-filter-menu-body-search">
          <input type="text" placeholder="Filter..." />
          <!-- <input
          type="text"
          placeholder="Filter..."
          bind:value={search}
          bind:this={input}
          on:keydown={onModifierKeyDown}
          /> -->
        </div>
        <div class="popup-filter-menu-body-list">
          <div
            class="popup-filter-menu-body-list-item"
            on:click={() => {
              console.log('Meta')
            }}
          >
            <div class="popup-filter-menu-body-list-item-text">Meta</div>
          </div>
          <div
            class="popup-filter-menu-body-list-item"
            on:click={() => {
              console.log('Control')
            }}
          >
            <div class="popup-filter-menu-body-list-item-text">Control</div>
          </div>
          <div
            class="popup-filter-menu-body-list-item"
            on:click={() => {
              console.log('Alt')
            }}
          >
            <div class="popup-filter-menu-body-list-item-text">Alt</div>
          </div>
          <div
            class="popup-filter-menu-body-list-item"
            on:click={() => {
              console.log('Shift')
            }}
          >
            <div class="popup-filter-menu-body-list-item-text">Shift</div>
          </div>
        </div>
      </div>
      <!-- popup darker background -->
      <div class="popup-filter-menu-background" />
    </div>
  {/if}
  <!-- filter menu here -->
  <!-- </div> -->
  <!-- <div class="search-results"> -->
  <div
    class="community-plugin-search-summary u-muted"
    style="display: flex;
  justify-content: center; font-size: 14px;"
  >
    {#if searchCommandsCount !== 0}
      <span in:blur={{ duration: 100 }}>
        {searchHotkeysCount} keys | {searchCommandsCount} cmds
      </span>
    {:else if searchCommandsCount === 0}
      <span in:blur={{ duration: 100 }}>Hotkeys not found</span>
    {/if}
  </div>
  <button
    id="hotkey-refresh-button"
    aria-label="Refresh Commands"
    class={refreshIsActive ? 'animation-is-active' : ''}
    on:click={sendRefreshCommands}
  >
    <RefreshIcon size={16} />
  </button>
</div>
