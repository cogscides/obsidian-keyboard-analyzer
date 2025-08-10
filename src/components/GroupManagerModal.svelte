<script lang="ts">
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { commandEntry } from '../interfaces/Interfaces'

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
    plugin = getContext('keyboard-analyzer-plugin')
  }

  const groupManager = plugin.groupManager
  const commandsManager = plugin.commandsManager

  let groupName = $derived.by(() => groupManager.getGroup(selectedGroupId || '')?.name || '')
  let commands: commandEntry[] = $derived.by(() => commandsManager.getGroupCommands(selectedGroupId || ''))

  // Drag & drop state
  let dragIndex: number | null = $state(null)

  function handleDragStart(index: number) {
    dragIndex = index
  }
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
  }
  function handleDrop(index: number) {
    if (dragIndex === null || selectedGroupId === 'all' || !selectedGroupId) return
    if (dragIndex === index) return
    groupManager.moveCommandInGroup(selectedGroupId, dragIndex, index)
    dragIndex = null
  }
</script>

<div class="kb-modal-backdrop" onclick={onClose}></div>
<div class="kb-modal" role="dialog" aria-modal="true" aria-label="Manage group">
  <div class="kb-modal-header">
    <h3>{groupName || 'Manage Group'}</h3>
    <button class="kb-close" onclick={onClose} aria-label="Close">×</button>
  </div>
  {#if !selectedGroupId || selectedGroupId === 'all'}
    <div class="kb-modal-body">
      <p class="u-muted">Select a user group to reorder its commands.</p>
    </div>
  {:else}
    <div class="kb-modal-body">
      {#if commands.length === 0}
        <div class="u-muted">No commands in this group yet.</div>
      {:else}
        <ul class="kb-dnd-list">
          {#each commands as cmd, i (cmd.id)}
            <li
              class="kb-dnd-item"
              draggable="true"
              ondragstart={() => handleDragStart(i)}
              ondragover={handleDragOver}
              ondrop={() => handleDrop(i)}
              aria-grabbed={dragIndex === i}
            >
              <span class="kb-dnd-handle">≡</span>
              <span class="kb-dnd-label">{cmd.pluginName}: {cmd.name}</span>
            </li>
          {/each}
        </ul>
        <div class="u-muted small">Drag items to reorder. Changes save automatically.</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .kb-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.45);
    z-index: 200000; /* Above any list/filter popovers */
  }
  .kb-modal { position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
    background: var(--background-primary); color: var(--text-normal);
    width: min(720px, 95vw); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.3);
    z-index: 200001;
  }
  .kb-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--background-modifier-border);
  }
  .kb-modal-body { padding: 12px 16px; max-height: 60vh; overflow: auto; }
  .kb-close { font-size: 18px; line-height: 1; padding: 4px 8px; }
  .kb-dnd-list { list-style: none; margin: 0; padding: 0; }
  .kb-dnd-item { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 6px; margin-bottom: 6px; background: var(--background-secondary);
  }
  .kb-dnd-handle { cursor: grab; user-select: none; font-weight: 600; opacity: .8; }
  .kb-dnd-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .small { font-size: 12px; }
</style>
