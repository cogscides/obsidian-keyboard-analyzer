<script lang="ts">
  import type { commandEntry } from '../../interfaces/Interfaces'

  interface Props {
    title: string
    chord: string
    message: string
    conflicts: commandEntry[]
    onConfirm: () => void
    onCancel: () => void
    onConfirmPin?: () => void
  }

  let { title, chord, message, conflicts = [], onConfirm, onCancel, onConfirmPin }: Props = $props()
</script>

<div
  class="kba-modal-backdrop"
  role="button"
  tabindex="0"
  onclick={onCancel}
  onkeydown={(e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onCancel())}
></div>
<div class="kba-modal" role="dialog" aria-modal="true" aria-label={title}>
  <div class="kba-modal-header">
    <h3>{title}</h3>
  </div>
  <div class="kba-modal-body">
    {#if chord}
      <div class="kba-chord">{chord}</div>
    {/if}
    <div class="kba-message">{message}</div>
    {#if conflicts.length}
      <div class="kba-conflicts">
        <div class="kba-conflicts-title">Conflicts:</div>
        {#each conflicts as c}
          <div class="kba-conflict-item">{c.name} <span class="u-muted">({c.id})</span></div>
        {/each}
      </div>
    {/if}
    {#if onConfirmPin}
      <div class="kba-note u-muted">“Pin and confirm” will pin this command and all conflicting ones.</div>
    {/if}
  </div>
  <div class="kba-modal-footer">
    {#if onConfirmPin}
      <button class="mod-cta" onclick={onConfirmPin}>Pin and confirm</button>
    {/if}
    <button class="mod-cta" onclick={onConfirm}>Confirm</button>
    <button onclick={onCancel}>Cancel</button>
  </div>
</div>

<style>
  .kba-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 1000;
  }
  .kba-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    min-width: 360px;
    max-width: 520px;
    box-shadow: var(--shadow-s);
  }
  .kba-modal-header { padding: 12px 14px; border-bottom: 1px solid var(--background-modifier-border); }
  .kba-modal-body { padding: 12px 14px; }
  .kba-modal-footer { padding: 10px 14px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--background-modifier-border); }
  .kba-chord { font-weight: 600; margin-bottom: 6px; }
  .kba-conflicts { margin-top: 8px; }
  .kba-conflicts-title { font-weight: 600; margin-bottom: 4px; }
  .kba-conflict-item { padding: 2px 0; }
  .kba-note { margin-top: 8px; font-size: 12px; }
  .u-muted { color: var(--text-muted); }
  .mod-cta { background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
</style>
