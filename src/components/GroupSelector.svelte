<script lang="ts">
import { getContext } from "svelte";
import GroupManagerModal from "./GroupManagerModal.svelte";
import type KeyboardAnalyzerPlugin from "../main";
import logger from "../utils/logger";

interface Props {
	selectedGroup: string;
	compact?: boolean;
	plugin?: KeyboardAnalyzerPlugin;
	onChange?: (groupId: string) => void;
}

let { selectedGroup = $bindable("all"), compact = $bindable(false), plugin = $bindable(), onChange = $bindable((_) => {}) }: Props = $props();

// Resolve plugin via prop first, then context as fallback
let _plugin: KeyboardAnalyzerPlugin;
try {
	_plugin = (plugin as KeyboardAnalyzerPlugin) || (getContext("keyboard-analyzer-plugin") as KeyboardAnalyzerPlugin);
} catch (err) {
	logger.error("[GroupSelector] failed to resolve plugin from context", err);
}
const _groupManager = _plugin?.groupManager;

let _isManagerOpen = $state(false);

function _openManager() {
	_isManagerOpen = true;
}
function _closeManager() {
	_isManagerOpen = false;
}
</script>

<div class="kb-group-selector" data-compact={compact ? 'true' : 'false'}>
  {#if !compact}
    <label class="u-muted" for="kb-group-select">Group</label>
  {/if}
  <div class="row">
    <select id="kb-group-select" class="dropdown" bind:value={selectedGroup} onchange={() => onChange(selectedGroup)}>
      <option value="all">All Commands</option>
      {#each (_groupManager?.getGroups?.() || []) as group (group.id)}
        <option value={group.id}>{group.name}</option>
      {/each}
    </select>
    {#if !compact && _plugin}
      <button class="btn-manage" onclick={_openManager} aria-label="Manage groups"
        >Manage</button
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
