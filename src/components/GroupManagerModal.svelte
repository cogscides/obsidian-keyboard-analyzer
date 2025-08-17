<script lang="ts">
  import { getContext } from 'svelte'
  import { X } from 'lucide-svelte'
  import clickOutside from '../utils/clickOutside.js'
  import type { commandEntry } from '../interfaces/Interfaces'
  import type { CGroupFilterSettings } from '../managers/settingsManager'
  import type KeyboardAnalyzerPlugin from '../main'
  import { formatHotkeyBaked } from '../utils/normalizeKeyDisplay'

  interface Props {
    plugin?: KeyboardAnalyzerPlugin
    selectedGroupId?: string
    onClose?: () => void
  }

  let {
    plugin = $bindable(),
    selectedGroupId = $bindable('all'),
    onClose = $bindable(() => {}),
  }: Props = $props()

  if (!plugin) {
    plugin = getContext('keyboard-analyzer-plugin') as KeyboardAnalyzerPlugin
  }

  const groupManager = (plugin as KeyboardAnalyzerPlugin).groupManager
  const commandsManager = (plugin as KeyboardAnalyzerPlugin).commandsManager
  const settingsManager = (plugin as KeyboardAnalyzerPlugin).settingsManager
  const hotkeyManager = (plugin as KeyboardAnalyzerPlugin).hotkeyManager

  let groups = $derived.by(() => groupManager.getGroups())

  let groupName = $derived.by(
    () => groupManager.getGroup(selectedGroupId || '')?.name || ''
  )
  let editableName = $state('')
  $effect(() => {
    editableName = groupName
  })
  let commands: commandEntry[] = $derived.by(() =>
    commandsManager.getGroupCommands(selectedGroupId || '')
  )

  // Inline "Add command" search (debounced)
  let cmdSearch = $state('')
  let cmdSearchOpen = $state(false)
  let cmdSearchResults: commandEntry[] = $state([])
  let cmdSearchLimit = 20
  let cmdSearchInputEl: HTMLInputElement | null = null
  let cmdSearchDebounce: ReturnType<typeof setTimeout> | null = null

  function renderFirstHotkey(entry: commandEntry): string {
    const hk = entry.hotkeys?.[0]
    if (!hk) return ''
    if (settingsManager.settings.useBakedKeyNames) return formatHotkeyBaked(hk)
    return hotkeyManager.renderHotkey(hk)
  }

  function runCommandSearch() {
    const term = (cmdSearch || '').trim()
    if (!selectedGroupId || selectedGroupId === 'all') {
      cmdSearchResults = []
      cmdSearchOpen = false
      return
    }
    const exclude = new Set<string>((commands || []).map((c) => c.id))
    let results: commandEntry[]
    if (!term) {
      // Show all commands (minus ones already in group) when query is empty
      const all = commandsManager.getCommandsList()
      results = []
      for (const c of all) {
        if (exclude.has(c.id)) continue
        results.push(c)
        // if (results.length >= cmdSearchLimit) break
      }
    } else {
      results = commandsManager.searchCommandsByName(term, {
        excludeIds: exclude,
        limit: cmdSearchLimit,
      })
    }
    cmdSearchResults = results
    cmdSearchOpen = true
  }

  function onCmdSearchInput() {
    if (cmdSearchDebounce) clearTimeout(cmdSearchDebounce)
    cmdSearchDebounce = setTimeout(runCommandSearch, 180)
  }

  function clearCmdSearch() {
    cmdSearch = ''
    cmdSearchResults = []
    cmdSearchOpen = false
    cmdSearchInputEl?.focus()
  }

  function handleCmdSearchFocus() {
    // Open and populate with all available commands when focused and empty
    if (!selectedGroupId || selectedGroupId === 'all') return
    if ((cmdSearch || '').trim().length === 0) {
      runCommandSearch()
    }
    cmdSearchOpen = true
  }

  function pickSearchResult(entry: commandEntry) {
    if (!selectedGroupId || selectedGroupId === 'all') return
    // Add to current group and remove from local results
    groupManager.addCommandToGroup(selectedGroupId, entry.id)
    cmdSearchResults = cmdSearchResults.filter((e) => e.id !== entry.id)
    // keep dropdown open with remaining results
  }

  function handleCmdSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      if (cmdSearchOpen) {
        cmdSearchOpen = false
        return
      }
      clearCmdSearch()
    }
  }

  // Behavior toggle (default vs dynamic)
  let behavior = $derived.by(
    () => groupManager.getGroupBehavior(selectedGroupId || 'all') || 'default'
  )
  function setBehavior(mode: 'default' | 'dynamic') {
    if (!selectedGroupId) return
    groupManager.setGroupBehavior(selectedGroupId, mode)
  }

  // Actions for defaults vs current
  function useCurrentFiltersAsDefaults() {
    if (!selectedGroupId || selectedGroupId === 'all') return
    const g = groupManager.getGroup(selectedGroupId)
    if (!g) return
    groupManager.setGroupDefaults(selectedGroupId, {
      filters: g.filterSettings as CGroupFilterSettings,
    })
  }
  function resetFiltersToDefaults() {
    if (!selectedGroupId || selectedGroupId === 'all') return
    groupManager.applyDefaultsToGroupFilters(selectedGroupId)
  }

  // All Commands: snapshot current filters as defaults (defensive)
  function snapshotAllAsDefaults() {
    try {
      const base = settingsManager?.settings?.defaultFilterSettings
      if (!base || typeof base !== 'object') return
      // Shallow clone is enough (flat booleans)
      groupManager.setAllGroupDefaults({
        filters: { ...(base as CGroupFilterSettings) } as CGroupFilterSettings,
      })
    } catch (err) {
      // Swallow to avoid uncaught runtime errors from UI click
      console.error('[groups] failed to set All defaults', err)
    }
  }
  // Register per-group command toggle
  let registerCommand = $derived.by(() => {
    if (!selectedGroupId || selectedGroupId === 'all') return false
    const g = groupManager.getGroup(selectedGroupId)
    return !!g?.registerCommand
  })
  function setRegisterCommand(val: boolean) {
    if (!selectedGroupId || selectedGroupId === 'all') return
    groupManager.setGroupRegisterCommand(selectedGroupId, !!val)
    ;(
      plugin as unknown as { syncPerGroupCommands?: () => void }
    ).syncPerGroupCommands?.()
  }

  // Drag & drop state for commands
  let dragIndex: number | null = $state(null)
  let hoverIndex: number | null = $state(null)
  let hoverAfter: boolean = $state(false)

  function handleDragStart(index: number) {
    dragIndex = index
  }
  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    hoverIndex = index
    hoverAfter = after
  }
  function handleDragLeave() {
    hoverIndex = null
  }
  function handleDrop() {
    if (dragIndex === null || selectedGroupId === 'all' || !selectedGroupId)
      return
    if (hoverIndex === null) {
      dragIndex = null
      return
    }
    let toIndex = hoverIndex + (hoverAfter ? 1 : 0)
    if (dragIndex < toIndex) toIndex -= 1 // adjust for removal
    if (toIndex < 0) toIndex = 0
    groupManager.moveCommandInGroup(selectedGroupId, dragIndex, toIndex)
    dragIndex = null
    hoverIndex = null
  }

  // Drag & drop state for groups + reorder mode
  let gDragIndex: number | null = $state(null)
  let gHoverIndex: number | null = $state(null)
  let gHoverAfter: boolean = $state(false)
  let reorderMode: boolean = $state(false)
  function handleGroupDragStart(index: number) {
    gDragIndex = index
  }
  function handleGroupDragOver(event: DragEvent, index: number) {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    gHoverIndex = index
    gHoverAfter = event.clientY > rect.top + rect.height / 2
  }
  function handleGroupDragLeave() {
    gHoverIndex = null
  }
  function handleGroupDrop() {
    if (gDragIndex === null || gHoverIndex === null) {
      gDragIndex = null
      gHoverIndex = null
      return
    }
    let toIndex = gHoverIndex + (gHoverAfter ? 1 : 0)
    if (gDragIndex < toIndex) toIndex -= 1
    if (toIndex < 0) toIndex = 0
    if (toIndex !== gDragIndex) groupManager.moveGroup(gDragIndex, toIndex)
    gDragIndex = null
    gHoverIndex = null
  }

  function handleRename() {
    if (!selectedGroupId || selectedGroupId === 'all') return
    const next = (editableName || '').trim()
    if (!next) return
    if (next !== groupName) {
      groupManager.renameGroup(selectedGroupId, next)
      ;(
        plugin as unknown as { syncPerGroupCommands?: () => void }
      ).syncPerGroupCommands?.()
    }
  }

  function handleDelete() {
    if (!selectedGroupId || selectedGroupId === 'all') return
    const ok = confirm('Delete this group? This cannot be undone.')
    if (!ok) return
    groupManager.removeGroup(selectedGroupId)
    ;(
      plugin as unknown as { syncPerGroupCommands?: () => void }
    ).syncPerGroupCommands?.()
    onClose()
  }

  function handleCreate() {
    const id = groupManager.createGroup('New Group')
    if (id) {
      selectedGroupId = id
    }
    ;(
      plugin as unknown as { syncPerGroupCommands?: () => void }
    ).syncPerGroupCommands?.()
  }

  function handleDuplicate() {
    if (!selectedGroupId || selectedGroupId === 'all') return
    const id = groupManager.duplicateGroup(selectedGroupId)
    if (id) {
      selectedGroupId = id
    }
    ;(
      plugin as unknown as { syncPerGroupCommands?: () => void }
    ).syncPerGroupCommands?.()
  }
</script>

<div class="kb-modal-backdrop" onclick={onClose}></div>
<div
  class="kb-modal"
  role="dialog"
  aria-modal="true"
  aria-label="Manage groups"
>
  <div class="kb-modal-header">
    <h3>Manage Groups</h3>
    <button class="kb-close" onclick={onClose} aria-label="Close">×</button>
  </div>
  <div class="kb-modal-body stack">
    <div class="kb-controls-row">
      <label class="u-muted small" for="kb-group-dropdown">Group</label>
      <select
        id="kb-group-dropdown"
        class="kb-input"
        bind:value={selectedGroupId}
        title="Select group"
      >
        <option value="all">All Commands</option>
        {#each groups as g (g.id)}
          <option value={String(g.id)}>{g.name}</option>
        {/each}
      </select>
      <button class="kb-btn" onclick={handleCreate} title="Create new group"
        >+ New</button
      >
      <button
        class="kb-btn"
        onclick={handleDuplicate}
        disabled={!selectedGroupId || selectedGroupId === 'all'}
        title="Duplicate selected group"
      >
        Duplicate
      </button>
      <button
        class="kb-btn"
        onclick={() => (reorderMode = !reorderMode)}
        aria-pressed={reorderMode}
        title="Reorder groups"
      >
        {reorderMode ? 'Done' : 'Reorder'}
      </button>
    </div>

    {#if reorderMode}
      <ul class="kb-group-reorder">
        {#each groups as g, gi (g.id)}
          <li
            class={`kb-group-li ${String(g.id) === selectedGroupId ? 'is-active' : ''} ${gHoverIndex === gi ? (gHoverAfter ? 'insert-after' : 'insert-before') : ''}`}
            draggable="true"
            ondragstart={() => handleGroupDragStart(gi)}
            ondragover={(e: DragEvent) => handleGroupDragOver(e, gi)}
            ondragleave={handleGroupDragLeave}
            ondrop={handleGroupDrop}
          >
            <span class="kb-dnd-handle">≡</span>
            <span class="kb-dnd-label">{g.name}</span>
            <div class="kb-reorder-controls">
              <button
                class="kb-btn small"
                onclick={() => groupManager.moveGroup(gi, Math.max(0, gi - 1))}
                aria-label="Move up"
                title="Move up"
              >
                ↑
              </button>
              <button
                class="kb-btn small"
                onclick={() =>
                  groupManager.moveGroup(
                    gi,
                    Math.min(groups.length - 1, gi + 1)
                  )}
                aria-label="Move down"
                title="Move down"
              >
                ↓
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <section class="kb-main">
        {#if !selectedGroupId || selectedGroupId === 'all'}
          <div class="kb-group-behavior">
            <label class="u-muted small">On open</label>
            <div class="kb-row">
              <label class="kb-radio">
                <input
                  type="radio"
                  name="onopen"
                  checked={behavior === 'default'}
                  onchange={() => setBehavior('default')}
                />
                Default settings
              </label>
              <label class="kb-radio">
                <input
                  type="radio"
                  name="onopen"
                  checked={behavior === 'dynamic'}
                  onchange={() => setBehavior('dynamic')}
                />
                Last used (dynamic)
              </label>
            </div>
            <div class="kb-row wrap">
              <button
                class="kb-btn"
                onclick={snapshotAllAsDefaults}
                title="Save current filters as All Commands defaults"
              >
                Use current filters as defaults
              </button>
              <button
                class="kb-btn"
                onclick={() => groupManager.applyDefaultsToAllFilters()}
                title="Apply saved All Commands defaults to current filters"
              >
                Reset filters to defaults
              </button>
            </div>
            </div>
        {:else}
          <div class="kb-group-meta">
            <label class="u-muted small" for="kb-group-name">Name</label>
            <div class="kb-row">
              <input
                id="kb-group-name"
                class="kb-input"
                type="text"
                bind:value={editableName}
                onblur={handleRename}
                onkeydown={(e: KeyboardEvent) =>
                  e.key === 'Enter' && handleRename()}
              />
              <button
                class="kb-btn danger"
                onclick={handleDelete}
                aria-label="Delete group"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="kb-group-behavior">
            <label class="u-muted small">On open</label>
            <div class="kb-row">
              <label class="kb-radio">
                <input
                  type="radio"
                  name="onopen"
                  checked={behavior === 'default'}
                  onchange={() => setBehavior('default')}
                />
                Default settings
              </label>
              <label class="kb-radio">
                <input
                  type="radio"
                  name="onopen"
                  checked={behavior === 'dynamic'}
                  onchange={() => setBehavior('dynamic')}
                />
                Last used (dynamic)
              </label>
            </div>
            <div class="kb-row wrap">
              <button
                class="kb-btn"
                onclick={useCurrentFiltersAsDefaults}
                title="Save current filters as this group's defaults"
              >
                Use current filters as defaults
              </button>
              <button
                class="kb-btn"
                onclick={resetFiltersToDefaults}
                title="Apply saved defaults to current filters"
              >
                Reset filters to defaults
              </button>
            </div>
          </div>

          <div class="kb-group-commands">
            <label class="u-muted small">Command palette</label>
            <div class="kb-row">
              <label class="kb-radio">
                <input
                  type="checkbox"
                  checked={registerCommand}
                  onchange={(e: Event) =>
                    setRegisterCommand(
                      (e.currentTarget as HTMLInputElement).checked
                    )}
                />
                Register “Open: {groupName}”
              </label>
            </div>
          </div>

          <!-- Add-command inline search -->
          {#if selectedGroupId !== 'all'}
          <div
            class="kb-cmd-search"
            use:clickOutside
            onclick_outside={() => (cmdSearchOpen = false)}
          >
            <label class="u-muted small" for="kb-cmd-search-input"
              >Add commands</label
            >
            <div class="kb-cmd-search-input">
              <input
                id="kb-cmd-search-input"
                class="kb-input"
                type="text"
                placeholder="Search commands to add..."
                bind:value={cmdSearch}
                bind:this={cmdSearchInputEl}
                oninput={onCmdSearchInput}
                onfocus={handleCmdSearchFocus}
                onkeydown={handleCmdSearchKeydown}
                aria-autocomplete="list"
                aria-expanded={cmdSearchOpen}
                aria-controls="kb-cmd-search-list"
              />
              {#if cmdSearch}
                <button
                  class="kb-icon clear"
                  aria-label="Clear search"
                  title="Clear"
                  onclick={clearCmdSearch}
                >
                  <X size={14} />
                </button>
              {/if}
            </div>

            {#if cmdSearchOpen && cmdSearchResults.length > 0}
              <ul
                id="kb-cmd-search-list"
                class="kb-cmd-dropdown"
                role="listbox"
              >
                {#each cmdSearchResults as r (r.id)}
                  <li
                    class="kb-cmd-option"
                    role="option"
                    aria-selected="false"
                    onclick={() => pickSearchResult(r)}
                    title={`${r.pluginName}: ${r.name}`}
                  >
                    <span class="label">{r.pluginName}: {r.name}</span>
                    {#if r.hotkeys && r.hotkeys.length > 0}
                      <span class="hk">{renderFirstHotkey(r)}</span>
                    {:else}
                      <span class="hk u-muted">no hotkey</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else if cmdSearchOpen && cmdSearch.trim().length > 0}
              <div class="kb-cmd-empty u-muted small">No matching commands</div>
            {/if}
          </div>
          {/if}

          {#if commands.length === 0}
            <div class="u-muted">No commands in this group yet.</div>
          {:else}
            <ul class="kb-dnd-list">
              {#each commands as cmd, i (cmd.id)}
                <li
                  class={`kb-dnd-item ${hoverIndex === i ? (hoverAfter ? 'insert-after' : 'insert-before') : ''}`}
                  draggable={selectedGroupId !== 'all'}
                  ondragstart={() => handleDragStart(i)}
                  ondragover={(e: DragEvent) => handleDragOver(e, i)}
                  ondragleave={handleDragLeave}
                  ondrop={handleDrop}
                  aria-grabbed={dragIndex === i}
                >
                  <span class="kb-dnd-handle">≡</span>
                  <span class="kb-dnd-label">{cmd.pluginName}: {cmd.name}</span>
                  <span class="kb-hk-list">
                    {#if cmd.hotkeys?.length}
                      {#each cmd.hotkeys as hk, hkIdx (hkIdx)}
                        <span class="hk">
                          {settingsManager.settings.useBakedKeyNames
                            ? formatHotkeyBaked(hk)
                            : hotkeyManager.renderHotkey(hk)}
                        </span>
                      {/each}
                    {:else}
                      <span class="hk u-muted">no hotkey</span>
                    {/if}
                  </span>
                  {#if selectedGroupId !== 'all'}
                  <button
                    class="kb-icon rm-icon"
                    title="Remove from group"
                    aria-label="Remove from group"
                    onclick={() =>
                      groupManager.removeCommandFromGroup(
                        selectedGroupId,
                        cmd.id
                      )}
                  >
                    <X size={14} />
                  </button>
                  {/if}
                </li>
              {/each}
            </ul>
            <div class="u-muted small">
              Drag items to reorder. Changes save automatically.
            </div>
          {/if}
        {/if}
      </section>
    {/if}
  </div>
</div>

<style>
  .kb-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 200000; /* Above any list/filter popovers */
  }
  .kb-modal {
    position: fixed;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--background-primary);
    color: var(--text-normal);
    width: min(720px, 95vw);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 200001;
  }
  .kb-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .kb-modal-body {
    padding: 12px 16px;
  }
  .kb-modal-body.stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 50vh;
    max-height: 70vh;
    overflow: visible; /* allow dropdowns to escape */
  }
  .kb-controls-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .kb-main {
    overflow: visible;
  }
  .kb-close {
    font-size: 18px;
    line-height: 1;
    padding: 4px 8px;
  }
  .kb-group-meta {
    margin-bottom: 10px;
  }
  .kb-group-meta .kb-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .kb-group-behavior {
    margin-bottom: 10px;
  }
  .kb-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .kb-row.wrap {
    flex-wrap: wrap;
  }
  .kb-radio {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    margin-right: 10px;
  }
  .kb-input {
    flex: 1 1 auto;
    min-width: 160px;
  }
  .kb-btn.danger {
    background: var(--background-modifier-error);
    border: 1px solid var(--background-modifier-error-hover);
    color: var(--text-on-accent);
    padding: 4px 8px;
    border-radius: 6px;
  }
  .kb-btn.small {
    padding: 2px 6px;
    font-size: 12px;
  }
  .kb-group-reorder {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: auto;
  }
  .kb-group-li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-secondary);
  }
  .kb-group-li.is-active {
    outline: 1px solid var(--interactive-accent);
  }
  .kb-group-li.insert-before {
    box-shadow: inset 0 2px 0 0 var(--interactive-accent);
  }
  .kb-group-li.insert-after {
    box-shadow: inset 0 -2px 0 0 var(--interactive-accent);
  }
  .kb-reorder-controls {
    margin-left: auto;
    display: inline-flex;
    gap: 4px;
  }
  .kb-hk-list {
    display: inline-flex;
    gap: 6px;
    margin-left: auto;
    flex-wrap: wrap;
  }
  .kb-dnd-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .kb-cmd-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .kb-cmd-option .label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kb-dnd-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .kb-dnd-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    margin-bottom: 6px;
    background: var(--background-secondary);
  }
  .kb-dnd-item.insert-before {
    box-shadow: inset 0 2px 0 0 var(--interactive-accent);
  }
  .kb-dnd-item.insert-after {
    box-shadow: inset 0 -2px 0 0 var(--interactive-accent);
  }
  .kb-icon.rm-icon {
    margin-left: auto;
    display: none;
    line-height: 0;
    opacity: 0.85;
  }
  .kb-dnd-item:hover .kb-icon.rm-icon {
    display: inline-flex;
  }
  .kb-icon.rm-icon:hover {
    color: var(--text-accent);
    opacity: 1;
  }
  .kb-dnd-handle {
    cursor: grab;
    user-select: none;
    font-weight: 600;
    opacity: 0.8;
  }
  .kb-dnd-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .small {
    font-size: 12px;
  }

  /* Add-command search styles */
  .kb-cmd-search {
    position: relative;
    margin: 8px 0 12px;
  }
  .kb-cmd-search-input {
    position: relative;
    display: flex;
    align-items: center;
  }
  .kb-cmd-search-input .kb-input {
    padding-right: 28px;
  }
  .kb-cmd-search-input .kb-icon.clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .kb-cmd-search-input .kb-icon.clear:hover {
    opacity: 1;
    color: var(--text-accent);
  }
  .kb-cmd-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 200010;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    margin: 6px 0 0;
    padding: 4px;
    max-height: 240px;
    overflow: auto;
    list-style: none;
  }
  .kb-cmd-option {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
  }
  .kb-cmd-option:hover {
    background: var(--background-secondary);
  }
  .kb-cmd-option .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 8px;
  }
  .hk {
    flex: 0 0 auto;
    font-family: var(--font-monospace);
    font-size: 12px;
    opacity: 0.9;
  }
  .kb-cmd-empty {
    padding: 6px 2px 0;
  }
</style>
