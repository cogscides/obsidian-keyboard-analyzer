<!-- AddToGroupPopoverFloating.svelte -->
<!-- Migrated version using @skeletonlabs/floating-ui-svelte -->
<script lang="ts">
  import { getContext, onMount, onDestroy } from 'svelte'
  import { X } from 'lucide-svelte'
  import {
    useFloating,
    flip,
    shift,
    offset,
  } from '@skeletonlabs/floating-ui-svelte'
  import type KeyboardAnalyzerPlugin from '../main'

  interface Props {
    /** The command ID to manage group membership for */
    commandId: string
    /** Callback when popover should close */
    onClose?: () => void
  }

  const { commandId, onClose = () => {} }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const _groupManager = plugin.groupManager

  // Internal state
  let search = $state('')
  let newGroupName = $state('')
  let rootEl = $state<HTMLDivElement | null>(null)

  // Arrow element for floating-ui
  let arrowElement = $state<HTMLDivElement | null>(null)

  // Floating UI configuration - arrow will be added via effect when element is ready
  const floating: ReturnType<typeof useFloating> = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(8), // 8px distance from trigger
      flip(), // Auto-flip when near viewport edges
      shift({ padding: 8 }), // Shift to stay within viewport
    ],
  })

  // Set the reference element to the parent anchor
  onMount(() => {
    if (rootEl && rootEl.parentElement instanceof HTMLElement) {
      floating.elements.reference = rootEl.parentElement
    }
  })

  // Filter groups based on search
  function _filteredGroups() {
    const term = search.trim().toLowerCase()
    const all = _groupManager.getGroups()
    if (!term) return all
    return all.filter((g: { name: string }) =>
      g.name.toLowerCase().includes(term)
    )
  }

  // Toggle command membership in group
  function _toggleMembership(groupId: string) {
    const inGroup = _groupManager.isCommandInGroup(groupId, commandId)
    if (inGroup) _groupManager.removeCommandFromGroup(groupId, commandId)
    else _groupManager.addCommandToGroup(groupId, commandId)
  }

  // Create new group and add command to it
  function _createGroupAndAdd() {
    const name = newGroupName.trim()
    if (!name) return
    const id: string = _groupManager.createGroup(name)
    if (id) _groupManager.addCommandToGroup(String(id), commandId)
    newGroupName = ''
    search = ''
  }

  // Handle click outside to close popover
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element
    if (
      rootEl &&
      !rootEl.contains(target) &&
      !rootEl.parentElement?.contains(target)
    ) {
      onClose()
    }
  }

  // Handle escape key to close popover
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
  }

  // Calculate arrow position from middleware data
  const arrowPosition = $derived(() => {
    const arrowData = floating.middlewareData?.arrow
    if (!arrowData) return { display: 'none' }

    const { x, y } = arrowData
    const side = floating.placement.split('-')[0]

    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[side] as string

    return {
      left: x != null ? `${x}px` : '',
      top: y != null ? `${y}px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px',
    }
  })

  // Set up event listeners when mounted
  onMount(() => {
    // Use capture phase to ensure we get events before other handlers
    document.addEventListener('click', handleClickOutside, { capture: true })
    document.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside, { capture: true })
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<div
  bind:this={rootEl}
  style={floating.floatingStyles}
  class="kb-popover floating floating-popover"
  role="dialog"
  aria-label="Add to group"
>
  <!-- Arrow element -->
  <div
    bind:this={arrowElement}
    class="floating-arrow"
    style:left={arrowPosition().left}
    style:top={arrowPosition().top}
    style:right={arrowPosition().right}
    style:bottom={arrowPosition().bottom}
    data-side={floating.placement.split('-')[0]}
  ></div>

  <!-- Header with search -->
  <div class="kb-popover-header">
    <div class="kb-input-wrap">
      <input
        type="text"
        placeholder="Search groups..."
        bind:value={search}
        class="kb-input"
      />
      {#if search}
        <button
          class="kb-clear"
          title="Clear"
          aria-label="Clear search"
          onclick={() => (search = '')}
        >
          <X size={14} />
        </button>
      {/if}
    </div>
  </div>

  <!-- Body with group list -->
  <div class="kb-popover-body">
    {#each _filteredGroups() as g (g.id)}
      <label class="kb-row">
        <input
          type="checkbox"
          checked={_groupManager.isCommandInGroup(String(g.id), commandId)}
          onchange={() => _toggleMembership(String(g.id))}
        />
        <span>{g.name}</span>
      </label>
    {/each}
  </div>

  <!-- Footer with new group creation -->
  <div class="kb-popover-footer">
    <input
      type="text"
      placeholder="New group name"
      bind:value={newGroupName}
      class="kb-input"
      onkeydown={(e: KeyboardEvent) =>
        e.key === 'Enter' && _createGroupAndAdd()}
    />
    <button class="kb-btn" onclick={_createGroupAndAdd}>Create & Add</button>
  </div>
</div>

<style>
  /* Floating popover specific styles */
  .kb-popover {
    min-width: 260px;
    max-height: 320px;
    overflow: auto;
    padding: 8px;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    z-index: 160000; /* above filter popover (150000) but below modal (200000) */
  }

  .kb-popover-header {
    margin-bottom: 8px;
  }

  .kb-input-wrap {
    position: relative;
  }

  .kb-input {
    width: 100%;
    padding: 6px 30px 6px 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
    font-size: 14px;
  }

  .kb-input:focus {
    border-color: var(--interactive-accent);
    outline: none;
  }

  .kb-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 2px;
  }

  .kb-clear:hover {
    opacity: 1;
    background: var(--background-modifier-hover);
  }

  .kb-popover-body {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 8px;
  }

  .kb-row {
    display: flex;
    align-items: center;
    padding: 4px 0;
    cursor: pointer;
    gap: 8px;
  }

  .kb-row:hover {
    background: var(--background-modifier-hover);
    margin: 0 -4px;
    padding: 4px;
    border-radius: 3px;
  }

  .kb-row input[type='checkbox'] {
    margin: 0;
  }

  .kb-row span {
    flex: 1;
    font-size: 14px;
    color: var(--text-normal);
  }

  .kb-popover-footer {
    border-top: 1px solid var(--background-modifier-border);
    padding-top: 8px;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .kb-btn {
    padding: 6px 12px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  .kb-btn:hover {
    background: var(--interactive-hover);
  }

  .kb-btn:active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
</style>
