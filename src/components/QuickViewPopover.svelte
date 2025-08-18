<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import clickOutside from '../utils/clickOutside.js'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import type KeyboardAnalyzerPlugin from '../main'
  import { VisualKeyboardManager } from '../managers'
  import { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import { convertModifiers } from '../utils/modifierUtils'
  import { formatHotkeyBaked } from '../utils/normalizeKeyDisplay'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    anchorEl?: HTMLElement | null
    onClose?: () => void
    listenToggle?: number
  }

  let {
    plugin,
    anchorEl = $bindable(null),
    onClose = $bindable(() => {}),
    listenToggle = $bindable(0),
  }: Props = $props()

  const commandsManager = plugin.commandsManager
  const settingsManager = plugin.settingsManager
  const groupManager = plugin.groupManager

  // Core state
  let search = $state('')
  let listenerActive = $state(false)
  let selectedGroup = $state(
    (settingsManager.getSetting('lastOpenedGroupId') as string) || 'all'
  )

  // Keys state via ActiveKeysStore
  const visualKeyboardManager = new VisualKeyboardManager()
  const activeKeysStore = new ActiveKeysStore(plugin.app, visualKeyboardManager)
  let activeKey = $state('')
  let activeModifiers: string[] = $state([])

  // Results
  let filtered: commandEntry[] = $state([])
  let selectedIndex = $state(0)
  let listEl: HTMLDivElement | null = null
  let inputEl: HTMLInputElement | null = null

  // Persisted size and anchoring
  let rootEl: HTMLDivElement | null = null
  let placeAbove = $state(false)
  let coords = $state({
    top: 0,
    left: 0,
    width: Math.max(
      320,
      Math.min(520, Number(settingsManager.settings.quickViewWidth || 380))
    ),
    maxHeight: Math.min(
      Math.floor((window.innerHeight || 600) * 0.6),
      Math.max(240, Number(settingsManager.settings.quickViewHeight || 360))
    ),
  })
  let anchorOffsetX = $state(0)
  let isResizing = false
  let suppressOutsideCloseUntil = 0

  // Refilter based on state
  function refilter() {
    const base = commandsManager.filterCommands(
      search,
      convertModifiers(activeModifiers),
      activeKey,
      selectedGroup
    )
    filtered = base.slice(0, 200)
    selectedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1))
  }

  // Listen nonce from plugin command (double-run)
  $effect(() => {
    listenToggle // reactive ping
    if (listenToggle) listenerActive = true
  })

  // Positioning near status bar icon
  function recomputePosition() {
    try {
      if (!rootEl || !anchorEl || isResizing) return
      const rect = anchorEl.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const vw = window.innerWidth || document.documentElement.clientWidth
      const margin = 6
      const desiredTop = rect.bottom + margin
      const estH = Math.min(
        Math.floor(vh * 0.6),
        Math.max(240, coords.maxHeight)
      )
      const fitsBelow = desiredTop + estH <= vh
      placeAbove = !fitsBelow
      const top = placeAbove
        ? Math.max(8, rect.top - margin - estH)
        : Math.min(vh - estH - 8, desiredTop)
      let left = anchorOffsetX ? rect.left + anchorOffsetX : rect.left
      const width = coords.width || rootEl.offsetWidth || 360
      if (left + width > vw - 8) left = Math.max(8, vw - width - 8)
      if (left < 8) left = 8
      coords = { ...coords, top, left, maxHeight: estH }
      anchorOffsetX = left - rect.left
    } catch {}
  }

  // Corner resize (top-left)
  let resizingCorner = false
  let startCX = 0,
    startCY = 0,
    startLeft = 0,
    startW = 0,
    startH = 0
  function onCornerDown(e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    resizingCorner = true
    isResizing = true
    startCX = e.clientX
    startCY = e.clientY
    startLeft = coords.left
    startW = coords.width
    startH = coords.maxHeight
    suppressOutsideCloseUntil = Date.now() + 250
    window.addEventListener('pointermove', onCornerMove, true)
    window.addEventListener('pointerup', onCornerUp, true)
  }
  function onCornerMove(e: PointerEvent) {
    if (!resizingCorner) return
    const dx = e.clientX - startCX
    const dy = e.clientY - startCY
    let left = startLeft + dx
    let width = startW - dx
    let height = startH + dy
    const minW = 320,
      minH = 240
    const vw = window.innerWidth || document.documentElement.clientWidth
    const vh = window.innerHeight || document.documentElement.clientHeight
    const maxH = Math.floor(vh * 0.6)
    if (width < minW) {
      left = startLeft + (startW - minW)
      width = minW
    }
    if (left < 8) {
      left = 8
      width = Math.max(minW, Math.min(startW - (startLeft - 8), vw - 16))
    }
    if (left + width > vw - 8) width = Math.max(minW, vw - 8 - left)
    if (height < minH) height = minH
    if (height > maxH) height = maxH
    coords = { ...coords, left, width, maxHeight: height }
    try {
      if (anchorEl)
        anchorOffsetX = coords.left - anchorEl.getBoundingClientRect().left
    } catch {}
    settingsManager.updateSettings({
      quickViewWidth: width,
      quickViewHeight: height,
    })
  }
  function onCornerUp() {
    if (!resizingCorner) return
    resizingCorner = false
    isResizing = false
    suppressOutsideCloseUntil = Date.now() + 120
    window.removeEventListener('pointermove', onCornerMove, true)
    window.removeEventListener('pointerup', onCornerUp, true)
  }

  // Left-edge width resize (optional but handy)
  let resizingLeft = false
  let startLX = 0,
    startLLeft = 0,
    startLW = 0
  function onLeftDown(e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    resizingLeft = true
    isResizing = true
    startLX = e.clientX
    startLLeft = coords.left
    startLW = coords.width
    suppressOutsideCloseUntil = Date.now() + 250
    window.addEventListener('pointermove', onLeftMove, true)
    window.addEventListener('pointerup', onLeftUp, true)
  }
  function onLeftMove(e: PointerEvent) {
    if (!resizingLeft) return
    const dx = e.clientX - startLX
    let left = startLLeft + dx
    let width = startLW - dx
    const minW = 320
    const vw = window.innerWidth || document.documentElement.clientWidth
    if (width < minW) {
      width = minW
      left = startLLeft + (startLW - minW)
    }
    if (left < 8) {
      left = 8
      width = Math.max(minW, Math.min(startLW - (startLLeft - 8), vw - 16))
    }
    if (left + width > vw - 8) width = Math.max(minW, vw - 8 - left)
    coords = { ...coords, left, width }
    try {
      if (anchorEl)
        anchorOffsetX = coords.left - anchorEl.getBoundingClientRect().left
    } catch {}
    settingsManager.updateSettings({ quickViewWidth: width })
  }
  function onLeftUp() {
    if (!resizingLeft) return
    resizingLeft = false
    isResizing = false
    suppressOutsideCloseUntil = Date.now() + 120
    window.removeEventListener('pointermove', onLeftMove, true)
    window.removeEventListener('pointerup', onLeftUp, true)
  }

  // Keyboard handling and selection
  function clampIndex(n: number): number {
    const max = Math.max(0, filtered.length - 1)
    if (max === 0) return 0
    if (n < 0) return max
    if (n > max) return 0
    return n
  }
  function moveSelection(delta: number) {
    selectedIndex = clampIndex(selectedIndex + delta)
    // ensure visible
    queueMicrotask(() => {
      const rows = listEl?.querySelectorAll<HTMLElement>('.qv-row')
      const el = rows?.[selectedIndex]
      el?.scrollIntoView({ block: 'nearest' })
    })
  }
  function runSelected() {
    const cmd = filtered[selectedIndex]
    if (!cmd) return
    try {
      plugin.app.commands.executeCommandById(cmd.id)
      commandsManager.addRecentCommand(cmd.id)
    } catch {}
    onClose?.()
  }

  function onKeydownGlobal(e: KeyboardEvent) {
    if (!rootEl) return
    const inside = rootEl.contains(e.target as Node)
    if (!inside) return

    const modF = (e.key === 'f' || e.key === 'F') && (e.metaKey || e.ctrlKey)
    if (modF) {
      e.preventDefault()
      e.stopPropagation()
      if (document.activeElement !== inputEl) {
        inputEl?.focus()
        return
      }
      listenerActive = !listenerActive
      return
    }

    if (listenerActive) {
      e.preventDefault()
      e.stopPropagation()
      try {
        activeKeysStore.handlePhysicalKeyDown(e)
      } catch {}
      activeKey = activeKeysStore.ActiveKey
      activeModifiers = activeKeysStore.ActiveModifiers as unknown as string[]
      refilter()
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose?.()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      moveSelection(1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      moveSelection(-1)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      moveSelection(e.shiftKey ? -1 : 1)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      runSelected()
      return
    }
  }
  function onKeyupGlobal(e: KeyboardEvent) {
    if (!rootEl || !listenerActive) return
    const inside = rootEl.contains(e.target as Node)
    if (!inside) return
    e.preventDefault()
    e.stopPropagation()
    try {
      activeKeysStore.handlePhysicalKeyUp(e)
    } catch {}
  }

  // UI helpers
  function clearSearch() {
    if (search.trim() === '') {
      activeKeysStore.reset()
      activeKey = ''
      activeModifiers = []
    } else {
      search = ''
    }
    refilter()
    inputEl?.focus()
  }
  function toggleListener() {
    listenerActive = !listenerActive
    inputEl?.focus()
  }
  function onInput() {
    refilter()
  }
  function onGroupChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value
    selectedGroup = val
    settingsManager.updateSettings({ lastOpenedGroupId: val })
    refilter()
  }
  function openFull(mode: boolean | 'split') {
    plugin.addShortcutsView(mode)
    onClose?.()
  }

  // Minimal filter dropdown (collapsed)
  let filtersOpen = $state(false)
  const filterKeys: Array<{
    key: keyof ReturnType<typeof groupManager.getGroupSettings>
    label: string
  }> = [
    { key: 'StrictModifierMatch', label: 'Strict modifiers' },
    { key: 'ViewWOhotkeys', label: 'Only with hotkeys' },
    { key: 'OnlyDuplicates', label: 'Only duplicates' },
    { key: 'DisplayInternalModules', label: 'Include internal modules' },
  ]
  function setFilter(key: string, val: boolean) {
    groupManager.updateGroupFilterSettings(selectedGroup, { [key]: val } as any)
    refilter()
  }

  // Mount/teardown
  const onScroll = () => recomputePosition()
  let ro: ResizeObserver | null = null
  onMount(() => {
    refilter()
    recomputePosition()
    window.addEventListener('resize', recomputePosition)
    document.addEventListener('scroll', onScroll, true)
    if ('ResizeObserver' in window && rootEl) {
      ro = new ResizeObserver(() => recomputePosition())
      ro.observe(rootEl)
    }
    window.addEventListener('keydown', onKeydownGlobal, true)
    window.addEventListener('keyup', onKeyupGlobal, true)
    queueMicrotask(() => inputEl?.focus())
  })
  onDestroy(() => {
    window.removeEventListener('resize', recomputePosition)
    document.removeEventListener('scroll', onScroll, true)
    ro?.disconnect()
    ro = null
    window.removeEventListener('keydown', onKeydownGlobal, true)
    window.removeEventListener('keyup', onKeyupGlobal, true)
    window.removeEventListener('pointermove', onCornerMove, true)
    window.removeEventListener('pointerup', onCornerUp, true)
    window.removeEventListener('pointermove', onLeftMove, true)
    window.removeEventListener('pointerup', onLeftUp, true)
  })
</script>

<div
  class="qv"
  class:is-above={placeAbove}
  style="position: fixed; top:{coords.top}px; left:{coords.left}px; width:{coords.width}px; max-height:{coords.maxHeight}px;"
  use:clickOutside
  onclick_outside={() => {
    if (Date.now() < suppressOutsideCloseUntil) return
    onClose?.()
  }}
  role="dialog"
  aria-label="Quick Commands"
  bind:this={rootEl}
>
  <div class="qv-corner" title="Resize" onpointerdown={onCornerDown}></div>
  <div class="qv-left" title="Resize width" onpointerdown={onLeftDown}></div>

  <header class="qv-header">
    <div class="qv-row-1">
      <select
        class="qv-group"
        onchange={onGroupChange}
        bind:value={selectedGroup}
      >
        <option value="all">All Commands</option>
        {#each groupManager.getGroups() as g}
          <option value={g.id}>{g.name}</option>
        {/each}
      </select>
      <div class="spacer"></div>
      <div class="qv-actions">
        <button
          class="qv-btn"
          onclick={() => (filtersOpen = !filtersOpen)}
          aria-expanded={filtersOpen}>Filters</button
        >
        <div class="sep"></div>
        <button class="qv-btn" onclick={() => openFull(false)}>Open</button>
        <button class="qv-btn" onclick={() => openFull(true)}>New Pane</button>
        <button class="qv-btn" onclick={() => openFull('split')}>Split</button>
      </div>
    </div>
    {#if filtersOpen}
      <div class="qv-filters">
        {#each filterKeys as f}
          {#key selectedGroup}
            <label class="qv-filter">
              <input
                type="checkbox"
                checked={groupManager.getGroupSettings(selectedGroup)[f.key]}
                onchange={(e) =>
                  setFilter(f.key, (e.target as HTMLInputElement).checked)}
              />
              {f.label}
            </label>
          {/key}
        {/each}
      </div>
    {/if}
    <div class="qv-search">
      <div class="chips">
        {#each activeModifiers as m}
          <kbd class="chip">{m}</kbd>
        {/each}
        {#if activeKey}
          <kbd class="chip">{activeKey}</kbd>
        {/if}
      </div>
      <input
        class="qv-input"
        type="text"
        placeholder="Search…"
        bind:value={search}
        bind:this={inputEl}
        oninput={onInput}
      />
      <div class="qv-right">
        <button
          class={`qv-btn ${listenerActive ? 'is-on' : ''}`}
          title={listenerActive
            ? 'Deactivate key listener (Esc)'
            : 'Activate key listener'}
          onclick={toggleListener}>Keys</button
        >
        <button class="qv-btn" title="Clear" onclick={clearSearch}>Clear</button
        >
      </div>
    </div>
  </header>

  <div
    class="qv-list"
    bind:this={listEl}
    role="listbox"
    aria-label="Command results"
  >
    {#if filtered.length === 0}
      <div class="qv-empty">No matching commands</div>
    {:else}
      {#each filtered as cmd, i (cmd.id)}
        <div
          class="qv-row {i === selectedIndex ? 'is-selected' : ''}"
          onclick={() => {
            selectedIndex = i
            runSelected()
          }}
        >
          <div class="qv-name">{cmd.name}</div>
          <div class="qv-hotkeys">
            {#each cmd.hotkeys as hk}
              <span class="hk"
                >{settingsManager.settings.useBakedKeyNames
                  ? formatHotkeyBaked(hk as hotkeyEntry)
                  : plugin.hotkeyManager.renderHotkey(hk as hotkeyEntry)}</span
              >
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .qv {
    min-width: 320px;
    max-width: 92vw;
    min-height: 220px;
    max-height: 60vh;
    height: 100%;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
    z-index: 180000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .qv-header {
    padding: 8px;
    border-bottom: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
  }
  .qv-row-1 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .qv-group {
    font-size: 12px;
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
  }
  .spacer {
    flex: 1 1 auto;
  }
  .qv-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .qv-btn {
    font-size: 12px;
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
  }
  .qv-btn:hover {
    background: var(--background-modifier-hover);
  }
  .qv-btn.is-on {
    color: var(--text-on-accent);
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
  }
  .sep {
    width: 1px;
    height: 16px;
    background: var(--background-modifier-border);
    margin: 0 4px;
  }
  .qv-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 8px 2px 4px;
  }
  .qv-filter {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .qv-search {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chips {
    display: flex;
    gap: 4px;
    align-items: center;
    min-height: 20px;
  }
  .chip {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 11px;
  }
  .qv-input {
    flex: 1 1 auto;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
  }
  .qv-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .qv-list {
    flex: 1 1 auto;
    overflow: auto;
    padding: 6px;
  }
  .qv-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
  }
  .qv-row:hover {
    background: var(--background-modifier-hover);
  }
  .qv-row.is-selected {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }
  .qv-name {
    flex: 1 1 auto;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .qv-hotkeys {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .hk {
    font-size: 11.5px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    text-wrap: nowrap;
    padding: 2px 6px;
  }

  .qv-left {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    border-right: 1px solid var(--background-modifier-border);
    background: linear-gradient(
      to right,
      color-mix(in oklab, var(--background-modifier-border), transparent 70%),
      transparent
    );
  }
  .qv-left:hover {
    background: linear-gradient(
      to right,
      color-mix(in oklab, var(--background-modifier-border), transparent 50%),
      transparent
    );
  }
  .qv-corner {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
    background: linear-gradient(
      135deg,
      color-mix(in oklab, var(--background-modifier-border), transparent 40%),
      transparent 65%
    );
    border-top-left-radius: 8px;
  }
  .qv-corner:hover {
    background: linear-gradient(
      135deg,
      color-mix(in oklab, var(--background-modifier-border), transparent 25%),
      transparent 65%
    );
  }
</style>
