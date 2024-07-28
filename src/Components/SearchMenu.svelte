<!-- svelte-ignore a11y_click_events_have_key_events -->
<script lang="ts">
  import type { Modifier } from 'obsidian'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { FilterSettings } from '../interfaces/Interfaces'
  import {
    CircleDotIcon,
    FilterIcon,
    CrossIcon,
    RefreshCw,
  } from 'lucide-svelte'
  import { fly, fade, slide, blur } from 'svelte/transition'
  import { SpecialSymbols, JavaSciptKeyCodes } from '../Constants'
  import settingsManager from '../managers/settingsManager.svelte'
  import PressedKeysStore from '../stores/activeKeysStore.svelte'
  import {
    getConvertedModifiers,
    sortModifiers,
  } from '../utils/_AppShortcuts.old'

  // COMPONENT PROPS
  interface Props {
    plugin: KeyboardAnalyzerPlugin
    inputHTML?: HTMLInputElement
    search?: string
    searchCommandsCount?: number
    searchHotkeysCount?: number
    keyboardListenerIsActive?: boolean
  }

  let {
    plugin = $bindable(),
    inputHTML = $bindable(),
    search = $bindable(''),
    searchCommandsCount = $bindable(0),
    searchHotkeysCount = $bindable(0),
    keyboardListenerIsActive = $bindable(false),
  }: Props = $props()

  const filterSettings = $derived(
    plugin.settingsManager.settings.filterSettings
  )

  let inputIsFocused = $state(false)
  let filterIsOpen = $state(false)
  let refreshIsActive = $state(false)

  const ClearSearch = () => {
    if (search === '') {
      PressedKeysStore.activeModifiers = []
      PressedKeysStore.activeKey = ''
      inputHTML?.focus()
    } else {
      search = ''
      inputHTML?.focus()
    }
  }

  const ActivateKeyboardListener = () => {
    keyboardListenerIsActive = !keyboardListenerIsActive
    inputHTML?.focus()
  }

  function RefreshCommands() {
    refreshIsActive = true
    setTimeout(() => {
      refreshIsActive = false
    }, 1000)
  }

  // on focus modifier keydown event add to activeSearchModifiers array
  // if modifier is already in array remove it
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState
  const onModifierKeyDown = (e: KeyboardEvent) => {
    // edit modifiers
    function pushModifier(modifier: string) {
      if (!PressedKeysStore.activeModifiers.includes(modifier)) {
        PressedKeysStore.activeModifiers.push(modifier)
      }
    }

    function spliceModifier(modifier: Modifier) {
      // splice modifier from activeSearchModifiers array
      PressedKeysStore.activeModifiers =
        PressedKeysStore.activeModifiers.filter(
          (activeModifier: string) => activeModifier !== modifier
        )
    }

    function handleModifier(modifierKey: Modifier) {
      if (PressedKeysStore.activeModifiers.includes(modifierKey)) {
        spliceModifier(modifierKey)
      } else {
        pushModifier(modifierKey)
      }
    }

    function handleBackspaceKey() {
      // TODO clear activeSearchKey
      if (
        keyboardListenerIsActive === true &&
        PressedKeysStore.activeKey !== 'Backspace'
      ) {
        e.preventDefault()
        PressedKeysStore.activeKey = 'Backspace'
      } else if (
        keyboardListenerIsActive === true &&
        PressedKeysStore.activeKey === 'Backspace'
      ) {
        e.preventDefault()
        PressedKeysStore.activeKey = ''
      } else if (keyboardListenerIsActive === false) {
        if (search === '' || inputHTML?.selectionStart === 0) {
          if (PressedKeysStore.activeKey !== '') {
            PressedKeysStore.activeKey = ''
          } else if (
            PressedKeysStore.activeKey === '' &&
            PressedKeysStore.activeModifiers.length > 0
          ) {
            PressedKeysStore.activeModifiers.slice(
              0,
              PressedKeysStore.activeModifiers.length - 1
            )
          }
        }
      }
    }

    function handleKeyPressed() {
      // @ts-ignore
      let clickedKeyJS = JavaSciptKeyCodes[e.keyCode]

      if (clickedKeyJS.Key !== PressedKeysStore.activeKey) {
        e.preventDefault()

        if (clickedKeyJS.Code === `Numpad${clickedKeyJS.Key}`) {
          PressedKeysStore.activeKey = clickedKeyJS.Code
        } else {
          PressedKeysStore.activeKey = clickedKeyJS.Key
        }
      } else if (
        clickedKeyJS.Key === PressedKeysStore.activeKey ||
        clickedKeyJS.Code === PressedKeysStore.activeKey
      ) {
        e.preventDefault()

        if (PressedKeysStore.activeKey === clickedKeyJS.Code) {
          PressedKeysStore.activeKey = ''
        } else if (PressedKeysStore.activeKey === clickedKeyJS.Key) {
          PressedKeysStore.activeKey = ''
        }
      } else {
        !(e.keyCode in JavaSciptKeyCodes)
          ? console.log('unknown key: ', JavaSciptKeyCodes[e.keyCode])
          : console.log('unknown key: ', e.key)
      }
    }

    if (
      keyboardListenerIsActive &&
      (e.getModifierState('Shift') ||
        e.getModifierState('Alt') ||
        e.getModifierState('Control'))
    ) {
      switch (e.key) {
        case 'Shift':
          handleModifier('Shift')
          break
        case 'Alt':
          handleModifier('Alt')
          break
        case 'Meta':
          // OSX ONLY
          handleModifier('Meta')
          break
        case 'Control':
          handleModifier('Ctrl')
          break
        default:
          // TODO: triggers if two modifiers are pressed at the same time
          console.log('unknown modifier: ', e.key)
          console.log('please report this to the developer')
          break
      }
      // return to stop event propagation
      return
    }

    if (e.key === 'Escape') {
      if (keyboardListenerIsActive) {
        keyboardListenerIsActive = false
      } else {
        inputHTML?.blur()
      }
    }

    if (e.key === 'Backspace') {
      handleBackspaceKey()
    }

    if (e.key === 'Meta') {
      e.preventDefault()
    }

    if (keyboardListenerIsActive === true) {
      handleKeyPressed()
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hotkey-settings-container" onkeydown={onModifierKeyDown}>
  <!-- <div class="hotkey-search-menu"> -->
  <div class="search-wrapper" class:is-focused={inputIsFocused}>
    <div class="modifiers-wrapper">
      {#if PressedKeysStore.activeModifiers.length > 0 || PressedKeysStore.activeKey !== null}
        {#each sortModifiers(PressedKeysStore.activeModifiers) as modifier}
          <kbd
            class="modifier"
            in:slide={{ duration: 100 }}
            out:fade={{ duration: 50 }}
            onclick={() => {
              PressedKeysStore.activeModifiers =
                PressedKeysStore.activeModifiers.filter(
                  (activeModifier) => activeModifier !== modifier
                )
              inputHTML?.focus()
            }}>{modifier}</kbd
          >
        {/each}
        {#if PressedKeysStore.activeKey !== ''}
          <kbd
            in:slide={{ duration: 100 }}
            out:fade={{ duration: 50 }}
            class="modifier"
            style="padding-left: 8px; padding-right: 8px;"
            onclick={() => (PressedKeysStore.activeKey = '')}
            >{PressedKeysStore.activeKey in SpecialSymbols
              ? SpecialSymbols[PressedKeysStore.activeKey]
              : PressedKeysStore.activeKey.length === 1
                ? PressedKeysStore.activeKey.toUpperCase()
                : PressedKeysStore.activeKey}
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
        onfocus={() => (inputIsFocused = true)}
        onblur={() => (inputIsFocused = false)}
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
          onclick={ActivateKeyboardListener}
        >
          <!-- use:longpress={600}
          on:longpress-start={($event: Event) => {
            inputHTML.focus()
            keyboardListenerIsActive = true
          }}
          on:longpress-end={($event: Event) => {
            keyboardListenerIsActive = false
          }} -->
          <CircleDotIcon size={20} />
        </div>
        <!-- <div class="meta-search-indicator pulse">
          <div class="inner-circle" />
        </div> -->
        <div class="clear-icon icon" onclick={ClearSearch}>
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
    onclick={() => {
      // console.log('filter: ', filterIsOpen)
      filterIsOpen = !filterIsOpen
    }}
  >
    <FilterIcon size={16} />
  </button>
  {#if filterIsOpen}
    <!-- use:clickOutside={() =>
        // await timeout 40ms
        setTimeout(() => {
          if (filterIsOpen) {
            filterIsOpen = false
          }
        }, 40)} -->
    <div
      transition:slide
      class="popup-filter-menu-container {filterIsOpen ? 'is-open' : ''}"
    >
      <div transition:fade>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings?.FeaturedFirst}
          >
            <!-- onclick={onFeaturedFirstOptionTriggered} -->
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.FeaturedFirst}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Display featured first
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.StrictSearch}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  StrictSearch: !filterSettings.StrictSearch,
                },
              })
              RefreshCommands()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.StrictSearch}
            />
          </div>
          <div class="setting-item-name popup-filter-title">Strict Search</div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.HighlightCustom}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  HighlightCustom: !filterSettings.HighlightCustom,
                },
              })
              RefreshCommands()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.HighlightCustom}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Highlight custom hotkeys
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.HighlightDuplicates}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  HighlightDuplicates: !filterSettings.HighlightDuplicates,
                },
              })
              RefreshCommands()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.HighlightDuplicates}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Highlight hotkey duplicates
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.DisplayIDs}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  DisplayIDs: !filterSettings.DisplayIDs,
                },
              })
              RefreshCommands()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.DisplayIDs}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Display command ID's
          </div>
        </div>
      </div>
      <!-- popup darker background -->
      <!-- svelte-ignore element_invalid_self_closing_tag -->
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
    onclick={RefreshCommands}
  >
    <RefreshCw size={16} />
  </button>
</div>
