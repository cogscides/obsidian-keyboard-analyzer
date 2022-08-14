<script lang="ts">
  // TYPES
  import type KeyboardAnalizerPlugin from 'src/main'
  import type { App, Hotkey, Command, Modifier } from 'obsidian'
  import type { FilterSettings } from 'src/Interfaces'

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
  import { longpress } from './longpress'

  // PLUGIN
  export let plugin: KeyboardAnalizerPlugin

  // COMPONENT VARIABLES
  export let inputHTML: HTMLInputElement
  export let search: string = ''
  export let activeSearchModifiers: string[] = []
  export let activeSearchKey: string = ''
  export let searchCommandsCount: number
  export let searchHotkeysCount: number

  export let FilterSettings: FilterSettings

  export let keyboardListenerIsActive: boolean = false
  let filterIsOpen: boolean = false
  let refreshIsActive: boolean = false

  const ClearSearch = () => {
    if (search === '') {
      activeSearchModifiers = []
      activeSearchKey = ''
      inputHTML.focus()
    } else {
      search = ''
      inputHTML.focus()
    }
  }

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

  function dispatchFeaturedFirstOptionTriggered(e: any) {
    dispatch('featured-first-option-triggered')
  }

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
          <kbd
            class="modifier"
            in:slide={{ duration: 100 }}
            out:fade={{ duration: 50 }}
            on:click={() => {
              activeSearchModifiers.splice(
                activeSearchModifiers.indexOf(modifier),
                1
              )
              activeSearchModifiers = activeSearchModifiers
              inputHTML.focus()
            }}>{modifier}</kbd
          >
        {/each}
        {#if activeSearchKey !== ''}
          <kbd
            in:slide={{ duration: 100 }}
            out:fade={{ duration: 50 }}
            class="modifier"
            style="padding-left: 8px; padding-right: 8px;"
            on:click={() => (activeSearchKey = '')}
            >{activeSearchKey in SpecialSymbols
              ? SpecialSymbols[activeSearchKey]
              : activeSearchKey.length === 1
              ? activeSearchKey.toUpperCase()
              : activeSearchKey}
          </kbd>
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
        <!-- @ts-ignore -->
        <div
          class="keyboard-icon icon {keyboardListenerIsActive ? 'pulse' : ''}"
          aria-label={keyboardListenerIsActive
            ? 'Press Esc to deactivate key listener'
            : `Press ${
                getConvertedModifiers(['Mod'])[0]
              }+F or long press to activate key listener`}
          on:click={ActivateKeyboardListener}
          use:longpress={600}
          on:longpress-start={() => {
            inputHTML.focus()
            keyboardListenerIsActive = true
          }}
          on:longpress-end={() => {
            keyboardListenerIsActive = false
          }}
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
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={FilterSettings.FeaturedFirst}
            on:click={dispatchFeaturedFirstOptionTriggered}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={FilterSettings.FeaturedFirst}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Display featured first
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={FilterSettings.HighlightCustom}
            on:click={() => {
              FilterSettings.HighlightCustom = !FilterSettings.HighlightCustom
              plugin.saveSettings()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={FilterSettings.HighlightCustom}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Highlight custom hotkeys
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={FilterSettings.HighlightDuplicates}
            on:click={() => {
              FilterSettings.HighlightDuplicates =
                !FilterSettings.HighlightDuplicates
              plugin.saveSettings()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={FilterSettings.HighlightDuplicates}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Highlight hotkey duplicates
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={FilterSettings.DisplayIDs}
            on:click={() => {
              FilterSettings.DisplayIDs = !FilterSettings.DisplayIDs
              plugin.saveSettings()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={FilterSettings.DisplayIDs}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Display command ID's
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
