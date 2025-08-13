<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import {
    CircleDotIcon,
    X as XIcon,
    Filter as FilterIcon,
  } from 'lucide-svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { commandEntry } from '../interfaces/Interfaces'
  import { clickOutside } from '../utils/clickOutside'
  import { convertModifiers, unconvertModifier } from '../utils/modifierUtils'
  import {
    getBakedKeyLabel,
    getBakedModifierLabel,
    formatHotkeyBaked,
  } from '../utils/normalizeKeyDisplay'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    anchorEl?: HTMLElement | null
    onClose?: () => void
    // External toggle signal (e.g., double-run) to activate listen mode
    listenToggle?: number
  }

  let {
    plugin,
    anchorEl = $bindable(null),
    onClose = $bindable(() => {}),
    listenToggle = $bindable(0),
  }: Props = $props()

  const commandsManager = plugin.commandsManager
  const hotkeyManager = plugin.hotkeyManager
  const settingsManager = plugin.settingsManager
  const groupManager = plugin.groupManager

  // State
  let search = $state('')
  let keyboardListenerIsActive = $state(false)
  let selectedGroupID = $state(
    (settingsManager.getSetting('lastOpenedGroupId') as string) || 'all'
  )
  let pluginFilter = $state('') // optional plugin filter

  // Active key state (lightweight listener mode, no VisualKeyboardManager)
  let activeKey = $state('')
  let activeModifiers: string[] = $state([])

  // Results
  let filteredCommands: commandEntry[] = $state([])
  let resultLimit = $state(100) // Cap results to keep list responsive

  // Debounce input
  let debounceT: ReturnType<typeof setTimeout> | null = null
  function scheduleRefilter() {
    if (debounceT) clearTimeout(debounceT)
    debounceT = setTimeout(() => {
      refilter()
    }, 180)
  }

  function refilter() {
    const base = commandsManager.filterCommands(
      search,
      convertModifiers(activeModifiers),
      activeKey,
      selectedGroupID
    )
    const withPlugin = pluginFilter
      ? base.filter(
          (c) =>
            (c.pluginName || '').toLowerCase() === pluginFilter.toLowerCase()
        )
      : base
    filteredCommands = withPlugin.slice(0, resultLimit)
  }

  // Toggle listen mode from external signal (double-run)
  $effect(() => {
    listenToggle
    if (listenToggle) {
      keyboardListenerIsActive = true
    }
  })

  // Re-run filter whenever inputs change
  $effect(() => {
    search
    selectedGroupID
    pluginFilter
    activeKey
    activeModifiers
    refilter()
  })

  // Listen mode handlers
  function handleKeyDown(e: KeyboardEvent) {
    // Esc — either exit listen mode or close popover
    if (e.key === 'Escape') {
      if (keyboardListenerIsActive) {
        keyboardListenerIsActive = false
      } else {
        onClose?.()
      }
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Mod+F toggles listen mode inside the popover
    const isMod = e.metaKey || e.ctrlKey
    if (isMod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f') {
      keyboardListenerIsActive = !keyboardListenerIsActive
      e.preventDefault()
      e.stopPropagation()
      return
    }

    if (!keyboardListenerIsActive) return

    // Prevent Obsidian from also handling keys while listening
    e.preventDefault()
    e.stopPropagation()

    // Update modifiers set
    const nextMods = new Set(activeModifiers)
    const mods: Array<{ flag: boolean; name: string }> = [
      { flag: e.ctrlKey, name: 'Control' },
      { flag: e.metaKey, name: 'Meta' },
      { flag: e.altKey, name: 'Alt' },
      { flag: e.shiftKey, name: 'Shift' },
    ]
    for (const m of mods) {
      if (m.flag) {
        nextMods.add(m.name)
      } else {
        // Only remove if it exists (avoids churn)
        if (nextMods.has(m.name)) nextMods.delete(m.name)
      }
    }
    activeModifiers = Array.from(nextMods)

    // Active key (only non-modifier keys)
    const k = (e.key || '').trim()
    if (k.length === 1 || /^[A-Za-z0-9]$/.test(k) || isSpecialKey(k)) {
      activeKey = normalizeDisplayKey(k)
    } else if (isArrowKey(k)) {
      activeKey = k
    } else if (
      k === 'Backspace' ||
      k === 'Enter' ||
      k === 'Tab' ||
      k === 'Space' ||
      k === ' '
    ) {
      activeKey = k === ' ' ? ' ' : k
    }
    // Schedule refiltering
    scheduleRefilter()
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (!keyboardListenerIsActive) return
    // When releasing all modifiers and the key, we keep the last state for filtering
    // Users can press Esc to clear quickly
  }

  function isSpecialKey(k: string): boolean {
    const specials = ['`', '-', '=', '[', ']', ';', "'", ',', '.', '/', '\\']
    return specials.includes(k)
  }
  function isArrowKey(k: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)
  }
  function normalizeDisplayKey(k: string): string {
    // Keep one-char as-is; respect space ' '
    if (k.length === 1) return k
    if (k === 'Space') return ' '
    return k
  }

  function toggleModifierChip(mod: string) {
    // Click on a chip to remove it
    activeModifiers = activeModifiers.filter((m) => m !== mod)
  }

  function clearChipsOrSearch() {
    if (search) {
      search = ''
      scheduleRefilter()
      return
    }
    // Clear keys
    activeKey = ''
    activeModifiers = []
    scheduleRefilter()
  }

  function toggleListenMode() {
    keyboardListenerIsActive = !keyboardListenerIsActive
  }

  function clearPluginFilter() {
    pluginFilter = ''
  }

  function onPluginBadgeClick(name: string) {
    if (!name) return
    pluginFilter = pluginFilter.toLowerCase() === name.toLowerCase() ? '' : name
  }

  function getDisplayCommandName(name: string, pluginName: string): string {
    const p = (pluginName || '').trim()
    const n = name || ''
    if (!p) return n
    const lower = n.toLowerCase()
    const pref = p.toLowerCase() + ': '
    const showPluginBadges =
      !!settingsManager.settings.defaultFilterSettings.ShowPluginBadges
    const groupByPlugin =
      !!settingsManager.settings.defaultFilterSettings.GroupByPlugin
    const shouldStripPrefix = groupByPlugin || showPluginBadges
    if (shouldStripPrefix && lower.startsWith(pref)) {
      return n.slice(pref.length).trim()
    }
    return n
  }

  function renderPrimaryHotkey(cmd: commandEntry): string {
    const hk = (cmd.hotkeys || [])[0]
    if (!hk) return ''
    if (settingsManager.settings.useBakedKeyNames) return formatHotkeyBaked(hk)
    return hotkeyManager.renderHotkey(hk)
  }

  // Positioning near anchorEl - fixed, clamped, flip above if needed
  let rootEl: HTMLDivElement | null = null
  let placeAbove = $state(false)
  let coords = $state({ top: 0, left: 0, maxHeight: 360 })

  function recomputePosition() {
    try {
      const el = rootEl
      if (!el || !anchorEl) return
      const rect = anchorEl.getBoundingClientRect()
      const viewportH =
        window.innerHeight || document.documentElement.clientHeight
      const viewportW =
        window.innerWidth || document.documentElement.clientWidth

      // Preferred position: below with small offset
      const offset = 6
      const desiredTop = rect.bottom + offset
      const estimatedHeight = Math.min(420, Math.max(300, coords.maxHeight))
      const fitsBelow = desiredTop + estimatedHeight <= viewportH
      placeAbove = !fitsBelow

      const top = placeAbove
        ? Math.max(8, rect.top - offset - estimatedHeight)
        : Math.min(viewportH - estimatedHeight - 8, desiredTop)

      // Horizontal clamping (try align left edge with anchor)
      let left = rect.left
      const width = el.offsetWidth || 320
      if (left + width > viewportW - 8)
        left = Math.max(8, viewportW - width - 8)
      if (left < 8) left = 8

      coords = { top, left, maxHeight: estimatedHeight }
    } catch {}
  }

  let ro: ResizeObserver | null = null
  const onScroll = () => recomputePosition()

  // Focus trap
  function trapTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const focusables = getFocusableElements(rootEl)
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (e.shiftKey) {
      if (active === first || !rootEl?.contains(active)) {
        last.focus()
        e.preventDefault()
      }
    } else {
      if (active === last || !rootEl?.contains(active)) {
        first.focus()
        e.preventDefault()
      }
    }
  }

  function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
    if (!container) return []
    const nodes = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    return Array.from(nodes)
  }

  onMount(() => {
    // Initial filter
    refilter()

    // Positioning observers
    recomputePosition()
    window.addEventListener('resize', recomputePosition)
    document.addEventListener('scroll', onScroll, true)

    if ('ResizeObserver' in window && rootEl) {
      ro = new ResizeObserver(() => recomputePosition())
      ro.observe(rootEl)
    }

    // Keyboard listeners
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)

    // Focus trap
    rootEl?.addEventListener('keydown', trapTab, true)

    // Focus search on open
    setTimeout(() => {
      const inp = rootEl?.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement | null
      inp?.focus()
      inp?.select()
    }, 0)
  })

  onDestroy(() => {
    window.removeEventListener('resize', recomputePosition)
    document.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('keydown', handleKeyDown, true)
    window.removeEventListener('keyup', handleKeyUp, true)
    rootEl?.removeEventListener('keydown', trapTab, true)
    ro?.disconnect()
    ro = null
  })
</script>

<div
  class="qv-popover"
  class:is-above={placeAbove}
  style="position: fixed; top: {coords.top}px; left: {coords.left}px; max-height:{coords.maxHeight}px;"
  use:clickOutside
  onclick_outside={onClose}
  role="dialog"
  aria-label="Quick View — Commands"
  bind:this={rootEl}
>
  <div class="qv-header">
    <div class="qv-input-wrap">
      <input
        type="text"
        placeholder="Search commands…"
        bind:value={search}
        oninput={() => scheduleRefilter()}
        aria-label="Search commands"
      />
      {#if search}
        <button
          class="qv-clear"
          title="Clear"
          aria-label="Clear search"
          onclick={clearChipsOrSearch}
        >
          <XIcon size={14} />
        </button>
      {/if}
    </div>

    <div class="qv-actions">
      <button
        class="icon-btn {keyboardListenerIsActive ? 'is-on' : ''}"
        title={keyboardListenerIsActive
          ? 'Listening… (Esc to stop)'
          : 'Activate key listener'}
        aria-pressed={keyboardListenerIsActive}
        onclick={toggleListenMode}
      >
        <CircleDotIcon size={16} />
      </button>
    </div>
  </div>

  <!-- Active keys / modifiers chips -->
  {#if keyboardListenerIsActive || activeKey || activeModifiers.length}
    <div class="qv-chips" role="group" aria-label="Active keys">
      {#each activeModifiers as mod}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <kbd
          class="chip"
          title="Remove modifier"
          onclick={() => toggleModifierChip(mod)}
        >
          {settingsManager.settings.useBakedKeyNames
            ? getBakedModifierLabel(unconvertModifier(mod as any) as any)
            : mod}
        </kbd>
      {/each}
      {#if activeKey}
        <kbd class="chip">
          {settingsManager.settings.useBakedKeyNames
            ? getBakedKeyLabel(activeKey)
            : activeKey}
        </kbd>
      {/if}
      {#if !search && (activeKey || activeModifiers.length)}
        <button
          class="chip clear"
          onclick={clearChipsOrSearch}
          aria-label="Clear keys">Clear</button
        >
      {/if}
    </div>
  {/if}

  <!-- Optional filters -->
  <div class="qv-filters">
    <div class="qv-filter-left">
      <label class="qv-select">
        <span class="label">Group</span>
        <select
          bind:value={selectedGroupID}
          oninput={() => scheduleRefilter()}
          aria-label="Filter by group"
        >
          <option value="all">All Commands</option>
          {#each groupManager.getGroups?.() || settingsManager.settings.commandGroups || [] as g (String((g as any).id || g.id))}
            <option value={String((g as any).id || g.id)}
              >{(g as any).name || g.name}</option
            >
          {/each}
        </select>
      </label>
    </div>
    <div class="qv-filter-right">
      <button
        class="chip filter {pluginFilter ? 'active' : ''}"
        title={pluginFilter
          ? `Filtering by ${pluginFilter}`
          : 'Filter by plugin (click a badge)'}
        aria-pressed={!!pluginFilter}
        onclick={clearPluginFilter}
      >
        <FilterIcon size={14} />
        {pluginFilter ? pluginFilter : 'Plugin'}
      </button>
    </div>
  </div>

  <!-- Results -->
  <div class="qv-list" role="listbox" aria-label="Command results">
    {#if filteredCommands.length === 0}
      <div class="qv-empty" role="status" aria-live="polite">
        No matching commands
      </div>
    {:else}
      {#each filteredCommands as cmd (cmd.id)}
        <div class="qv-row" role="option" aria-selected="false">
          {#if settingsManager.settings.defaultFilterSettings.ShowPluginBadges}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <button
              class="qv-badge {cmd.isInternalModule ? 'is-builtin' : ''}"
              title="Filter by plugin"
              onclick={() => onPluginBadgeClick(cmd.pluginName)}
            >
              {cmd.pluginName}
            </button>
          {/if}
          <div class="qv-title" title={cmd.name}>
            {getDisplayCommandName(cmd.name, cmd.pluginName)}
          </div>
          <div class="qv-hotkey" aria-label="Primary hotkey">
            {renderPrimaryHotkey(cmd)}
          </div>
        </div>
      {/each}
      {#if commandsManager.filterCommands(search, convertModifiers(activeModifiers), activeKey, selectedGroupID).length > filteredCommands.length}
        <div class="qv-more">
          Showing first {filteredCommands.length}… refine search to narrow
          results
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .qv-popover {
    min-width: 360px;
    max-width: 600px;
    overflow: hidden;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
    z-index: 180000; /* below modals, above popovers */
    display: flex;
    flex-direction: column;
  }
  .qv-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .qv-input-wrap {
    position: relative;
    flex: 1 1 auto;
  }
  .qv-input-wrap input[type='text'] {
    width: 100%;
    height: 34px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 0 28px 0 10px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }
  .qv-input-wrap .qv-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
  }
  .qv-input-wrap .qv-clear:hover {
    color: var(--text-normal);
    border-color: var(--interactive-accent);
  }
  .qv-actions {
    display: flex;
    gap: 6px;
  }
  .icon-btn {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-muted);
    background: transparent;
  }
  .icon-btn:hover,
  .icon-btn:focus-visible {
    color: var(--text-normal);
    border-color: var(--interactive-accent);
  }
  .icon-btn.is-on {
    color: var(--text-accent);
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 2px
      color-mix(in oklab, var(--interactive-accent), transparent 80%);
  }

  .qv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 8px 2px 8px;
  }
  .qv-chips .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    background: var(--background-secondary);
    color: var(--text-normal);
    cursor: pointer;
  }
  .qv-chips .chip.clear {
    background: transparent;
    color: var(--text-muted);
  }
  .qv-chips .chip.clear:hover {
    color: var(--text-normal);
    border-color: var(--interactive-accent);
  }

  .qv-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .qv-select {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .qv-select .label {
    color: var(--text-muted);
    font-size: 12px;
  }
  .qv-select select {
    height: 26px;
    border-radius: 6px;
    background: var(--background-modifier-form-field);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    padding: 0 6px;
  }
  .qv-filter-right .chip.filter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-muted);
  }
  .qv-filter-right .chip.filter.active {
    color: var(--text-normal);
    border-color: var(--interactive-accent);
  }

  .qv-list {
    overflow: auto;
    padding: 6px 4px 8px 4px;
  }
  .qv-empty {
    color: var(--text-muted);
    text-align: center;
    padding: 24px 8px;
  }
  .qv-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
  }
  .qv-row:hover {
    background: var(--background-secondary);
  }
  .qv-badge {
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-muted);
    border-radius: 4px;
    font-size: 10px;
    padding: 0 4px;
    text-transform: uppercase;
  }
  .qv-badge.is-builtin::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--interactive-accent);
    margin-right: 6px;
    vertical-align: middle;
  }
  .qv-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .qv-hotkey {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .qv-more {
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
    padding: 4px 0 2px 0;
  }
</style>
