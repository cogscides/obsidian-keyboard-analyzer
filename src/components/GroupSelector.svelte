<script lang="ts">
  import { getContext } from 'svelte'
  import GroupManagerModal from './GroupManagerModal.svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import { Save, RotateCcw } from 'lucide-svelte'
  import logger from '../utils/logger'

  interface Props {
    selectedGroup: string
    compact?: boolean
    plugin?: KeyboardAnalyzerPlugin
    onChange?: (groupId: string) => void
  }

  let {
    selectedGroup = $bindable('all'),
    compact = $bindable(false),
    plugin = $bindable(),
    onChange = $bindable(_ => {}),
  }: Props = $props()

  // Resolve plugin via prop first, then context as fallback (safely)
  function resolvePluginFromContext(): KeyboardAnalyzerPlugin | undefined {
    try {
      return getContext('keyboard-analyzer-plugin') as KeyboardAnalyzerPlugin
    } catch (err) {
      logger.error('[GroupSelector] failed to resolve plugin from context', err)
      return undefined
    }
  }

  const _plugin: KeyboardAnalyzerPlugin | undefined =
    plugin ?? resolvePluginFromContext()
  const _groupManager = _plugin?.groupManager

  let _isManagerOpen = $state(false)

  // Check if current group has unsaved filter changes
  const hasUnsavedChanges = $derived.by(() => {
    if (!_groupManager || !selectedGroup) return false
    try {
      // Force reactive tracking of groups and settings to detect changes
      _groupManager.groups
      _plugin?.settingsManager?.settings
      return _groupManager.hasUnsavedFilterChanges(selectedGroup)
    } catch (err) {
      logger.error('[GroupSelector] hasUnsavedChanges check failed', err)
      return false
    }
  })

  function _openManager() {
    _isManagerOpen = true
  }
  function _closeManager() {
    _isManagerOpen = false
  }

  function _saveCurrentAsDefaults() {
    if (!_groupManager || !selectedGroup) return
    try {
      _groupManager.saveCurrentFiltersAsDefaults(selectedGroup)
      logger.debug('[GroupSelector] saved current filters as defaults', {
        selectedGroup,
      })
    } catch (err) {
      logger.error(
        '[GroupSelector] failed to save current filters as defaults',
        err
      )
    }
  }

  function _resetToDefaults() {
    if (!_groupManager || !selectedGroup) return
    try {
      _groupManager.resetFiltersToDefaults(selectedGroup)
      logger.debug('[GroupSelector] reset filters to defaults', {
        selectedGroup,
      })
    } catch (err) {
      logger.error('[GroupSelector] failed to reset filters to defaults', err)
    }
  }
</script>

<div class="kb-group-selector" data-compact={compact ? 'true' : 'false'}>
  {#if !compact}
    <label class="u-muted" for="kb-group-select">Group</label>
  {/if}
  <div class="row">
    <select
      id="kb-group-select"
      class="dropdown"
      bind:value={selectedGroup}
      onchange={() => onChange(selectedGroup)}
    >
      <option value="all">All Commands</option>
      {#each _groupManager?.getGroups?.() || [] as group (group.id)}
        <option value={group.id}>{group.name}</option>
      {/each}
    </select>

    {#if !compact && _plugin}
      {#if hasUnsavedChanges}
        <div class="changes-actions">
          <button
            class="btn-save"
            onclick={_saveCurrentAsDefaults}
            aria-label="Save current settings as group defaults"
            title="Save current filter settings as defaults for this group"
          >
            <Save size={14} />
            Save
          </button>
          <button
            class="btn-reset"
            onclick={_resetToDefaults}
            aria-label="Reset to group defaults"
            title="Reset filter settings to saved defaults"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      {/if}
      <button
        class="btn-manage"
        onclick={_openManager}
        aria-label="Manage groups">Manage</button
      >
    {/if}
  </div>

  {#if _isManagerOpen && _plugin}
    <GroupManagerModal
      plugin={_plugin}
      selectedGroupId={selectedGroup}
      onClose={_closeManager}
    />
  {/if}
</div>

<style>
  .kb-group-selector {
    margin-top: 0.5rem;
  }
  .kb-group-selector[data-compact='true'] {
    margin-top: 0;
  }
  .kb-group-selector .row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .kb-group-selector .changes-actions {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .kb-group-selector .btn-save,
  .kb-group-selector .btn-reset,
  .kb-group-selector .btn-manage {
    padding: 4px 8px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .kb-group-selector .btn-save {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: 1px solid var(--interactive-accent);
  }
  .kb-group-selector .btn-save:hover {
    background-color: var(--interactive-accent-hover);
    border-color: var(--interactive-accent-hover);
  }
  .kb-group-selector .btn-reset {
    background-color: var(--background-secondary);
    color: var(--text-muted);
    border: 1px solid var(--background-modifier-border);
  }
  .kb-group-selector .btn-reset:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .kb-group-selector label {
    margin-right: 8px;
  }
  .kb-group-selector select {
    min-width: 220px;
  }
  .kb-group-selector :global(.dropdown) {
    margin-top: 0;
  }
  .kb-group-selector :global(.u-muted) {
    font-size: 12px;
    opacity: 0.8;
  }
</style>
