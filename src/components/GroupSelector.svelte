<script lang="ts">
  import GroupManagerModal from './GroupManagerModal.svelte'
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'

  interface Props {
    selectedGroup: string
  }

  let { selectedGroup = $bindable('all') }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const _groupManager = plugin.groupManager

  let _isManagerOpen = $state(false)

  function _openManager() {
    _isManagerOpen = true
  }
  function _closeManager() {
    _isManagerOpen = false
  }
</script>

<div class="kb-group-selector">
  <label class="u-muted" for="kb-group-select">Group</label>
  <div class="row">
    <select id="kb-group-select" class="dropdown" bind:value={selectedGroup}>
      <option value="all">All Commands</option>
      {#each _groupManager.getGroups() as group (group.id)}
        <option value={group.id}>{group.name}</option>
      {/each}
    </select>
    <button class="btn-manage" onclick={_openManager} aria-label="Manage groups"
      >Manage</button
    >
  </div>

  {#if _isManagerOpen}
    <GroupManagerModal
      {plugin}
      selectedGroupId={selectedGroup}
      onClose={_closeManager}
    />
  {/if}
</div>

<style>
  .kb-group-selector {
    margin-top: 0.5rem;
  }
  .kb-group-selector .row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .kb-group-selector .btn-manage {
    padding: 4px 8px;
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
