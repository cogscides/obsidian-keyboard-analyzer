<script lang="ts">
  import { getContext } from 'svelte'
  import { X } from 'lucide-svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import { clickOutside } from '../utils/clickOutside'

  interface Props {
    commandId: string
    onClose?: () => void
  }

  let { commandId, onClose = $bindable(() => {}) }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const groupManager = plugin.groupManager

  let search = $state('')
  let newGroupName = $state('')
  let placeAbove = $state(false)

  function filteredGroups() {
    const term = search.trim().toLowerCase()
    const all = groupManager.getGroups()
    if (!term) return all
    return all.filter((g) => g.name.toLowerCase().includes(term))
  }

  function toggleMembership(groupId: string) {
    const inGroup = groupManager.isCommandInGroup(groupId, commandId)
    if (inGroup) groupManager.removeCommandFromGroup(groupId, commandId)
    else groupManager.addCommandToGroup(groupId, commandId)
  }

  function createGroupAndAdd() {
    const name = newGroupName.trim()
    if (!name) return
    groupManager.createGroup(name)
    // add to the newly created group by id lookup
    const g = groupManager.getGroups().find((gg) => gg.name === name)
    if (g) groupManager.addCommandToGroup(String(g.id), commandId)
    newGroupName = ''
    search = ''
  }
</script>

<div
  class="kb-popover {placeAbove ? 'is-above' : 'is-below'}"
  use:clickOutside
  ononclick_outside={onClose}
  role="dialog"
  aria-label="Add to group"
>
  <div class="kb-popover-header">
    <div class="kb-input-wrap">
      <input
        type="text"
        placeholder="Search groups..."
        bind:value={search}
        class="kb-input"
      />
      {#if search}
        <button class="kb-clear" title="Clear" aria-label="Clear search" onclick={() => (search = '')}>
          <X size={14} />
        </button>
      {/if}
    </div>
  </div>
  <div class="kb-popover-body">
    {#each filteredGroups() as g (g.id)}
      <label class="kb-row">
        <input
          type="checkbox"
          checked={groupManager.isCommandInGroup(String(g.id), commandId)}
          onchange={() => toggleMembership(String(g.id))}
        />
        <span>{g.name}</span>
      </label>
    {/each}
  </div>
  <div class="kb-popover-footer">
    <input
      type="text"
      placeholder="New group name"
      bind:value={newGroupName}
      class="kb-input"
      onkeydown={(e) => e.key === 'Enter' && createGroupAndAdd()}
    />
    <button class="kb-btn" onclick={createGroupAndAdd}>Create & Add</button>
  </div>
</div>

<style>
  .kb-popover { position: absolute; top: calc(100% + 6px); left: 0; min-width: 260px; max-height: 320px; overflow: auto; padding: 8px; background: var(--background-primary);
    border: 1px solid var(--background-modifier-border); border-radius: 6px; box-shadow: 0 12px 24px rgba(0,0,0,.2);
    z-index: 160000; /* above filter popover (150000) but below modal (200000) */
  }
  .kb-popover::after {
    content: '';
    position: absolute;
    width: 0; height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
  }
  .kb-popover.is-below::after {
    top: -7px;
    left: 12px;
    border-bottom: 7px solid var(--background-primary);
  }
  .kb-popover.is-above::after {
    bottom: -7px;
    left: 12px;
    border-top: 7px solid var(--background-primary);
  }
  .kb-input-wrap { position: relative; }
  .kb-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); opacity: .8; display: inline-flex; align-items: center; justify-content: center; }
  .kb-clear:hover { opacity: 1; }
  .kb-popover-header { padding: 4px; }
  .kb-popover-body { padding: 4px 0; display: flex; flex-direction: column; gap: 4px; }
  .kb-popover-footer { display: flex; gap: 6px; padding: 4px; }
  .kb-row { display: flex; align-items: center; gap: 8px; padding: 4px 6px; }
  .kb-input { width: 100%; }
  .kb-btn { padding: 4px 8px; }
</style>
