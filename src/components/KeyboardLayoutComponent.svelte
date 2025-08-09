<!-- src/Components/KeyboardLayoutComponent.svelte -->
<script lang="ts">
  import { setContext, getContext } from 'svelte'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type {
    KeyboardLayout,
    commandEntry,
    KeyboardSection,
  } from '../interfaces/Interfaces'
  import KeyboardKey from './KeyboardKey.svelte'
  import { Coffee as CoffeeIcon, CrossIcon } from 'lucide-svelte'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte'

  interface Props {
    visibleCommands: commandEntry[]
  }

  let { visibleCommands = [] }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager',
  )
  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')
  let KeyboardObject: KeyboardLayout = $state(visualKeyboardManager.layout)

  // DEBUGGER
  let keyClicked = $state('')

  function calculateSectionColumns(section: KeyboardSection) {
    return (
      section.rows.reduce((maxWidth, row) => {
        const rowWidth = row.reduce((sum, key) => sum + (key.width || 1), 0)
        return Math.max(maxWidth, rowWidth)
      }, 0) * 4
    ) // Multiply by 4 to match the original scale
  }

  $effect(() => {
    visualKeyboardManager.calculateAndAssignWeights(visibleCommands)
  })

  let gridTemplateColumns = KeyboardObject.sections
    .map((section) => `${section.gridRatio}fr`)
    .join(' ')
  let gridTemplateAreas = `'${KeyboardObject.sections.map((section) => section.name).join(' ')}'`

  // Calculate max columns for each section
  let sectionColumns = KeyboardObject.sections.reduce(
    (acc, section) => {
      acc[section.name] = calculateSectionColumns(section)
      return acc
    },
    {} as Record<string, number>,
  )

  // Local UI state for toolbar controls
  let panelCollapsed = $state(false)
  let heatmapScope: 'filtered' | 'all' = $state('filtered')
</script>

<div class="keyboard-panel {panelCollapsed ? 'collapsed' : ''}">
  <div class="keyboard-toolbar" role="toolbar" aria-label="Keyboard controls">
    <div class="toolbar-left">
      <button
        class="panel-toggle"
        aria-label={panelCollapsed ? 'Expand keyboard' : 'Collapse keyboard'}
        aria-expanded={!panelCollapsed}
        onclick={() => (panelCollapsed = !panelCollapsed)}
        title={panelCollapsed ? 'Show keyboard' : 'Hide keyboard'}
      >
        <span class={`chevron ${panelCollapsed ? 'is-collapsed' : ''}`}>⌄</span>
        <span class="toggle-label">Keyboard</span>
      </button>
      <div class="segmented" role="group" aria-label="Heatmap scope">
        <button
          class={heatmapScope === 'filtered' ? 'is-active' : ''}
          aria-pressed={heatmapScope === 'filtered'}
          title="Heatmap matches current filters/search"
          onclick={() => (heatmapScope = 'filtered')}
        >
          Filtered
        </button>
        <button
          class={heatmapScope === 'all' ? 'is-active' : ''}
          aria-pressed={heatmapScope === 'all'}
          title="Heatmap counts all commands"
          onclick={() => (heatmapScope = 'all')}
        >
          All
        </button>
      </div>
    </div>
    <div class="toolbar-right">
      <button
        class="donation-badge"
        onclick={() => window.open('https://ko-fi.com/S6S5E6K74', '_blank')}
        aria-label="Donate"
        title="Support development"
      >
        <div style="padding-right: 6px;">
          <CoffeeIcon size={16} />
        </div>
        Donate
      </button>
    </div>
  </div>

  <div class="panel-content">

    {#if !panelCollapsed}
      <div class="keyboard-surface">
        <div
          id="keyboard-layout"
          style:grid-template-columns={gridTemplateColumns}
          style:grid-template-areas={gridTemplateAreas}
          data-scope={heatmapScope}
        >
          {#each KeyboardObject.sections as section}
            <div
              class={section.name}
              style:grid-template-columns={`repeat(${sectionColumns[section.name]}, 1fr)`}
            >
              {#each section.rows as row}
                {#each row as key}
                  <KeyboardKey {key} />
                {/each}
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
<style>
  .keyboard-panel {
    display: inline-block;
    width: 100%;
    background: var(--background-modifier-border);
    border: 1px solid var(--indentation-guide);
    border-radius: 12px;
    padding: 8px 12px 12px 12px;
  }

  .panel-content { margin: 0 auto; width: 100%; max-width: 100%; }
  .keyboard-panel.collapsed .panel-content { max-width: 816px; width: 100%; }

  .keyboard-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  /* Removed collapsed toolbar max-width/padding to avoid width jumps */

  /* Prevent overflow on medium-and-down screens: toolbar full width */
  #keyboard-component.md .keyboard-toolbar,
  #keyboard-component.sm .keyboard-toolbar,
  #keyboard-component.is-mobile .keyboard-toolbar {
    max-width: 100%;
    padding-left: 12px;
    padding-right: 12px;
  }

  /* Prevent overflow on medium-and-down screens: let content fit screen */
  #keyboard-component.md .keyboard-panel:not(.collapsed) .panel-content,
  #keyboard-component.sm .keyboard-panel:not(.collapsed) .panel-content,
  #keyboard-component.is-mobile .keyboard-panel:not(.collapsed) .panel-content {
    width: 100%;
    max-width: 100%;
  }

  .toolbar-left,
  .toolbar-right {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .panel-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    gap: 6px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-modifier-form-field);
    color: var(--text-faint);
    cursor: pointer;
    line-height: 1;
    white-space: nowrap;
  }

  .panel-toggle:hover,
  .panel-toggle:focus-visible {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
  }
  .panel-toggle .toggle-label {
    font-weight: 600;
    margin-left: 6px;
  }

  /* Segmented control for scope */
  .segmented {
    display: inline-flex;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    overflow: hidden;
  }
  .segmented > button {
    height: 28px;
    padding: 0 8px;
    background: var(--background-modifier-form-field);
    color: var(--text-muted);
    border: none;
    cursor: pointer;
  }
  .segmented > button + button {
    border-left: 1px solid var(--background-modifier-border);
  }
  .segmented > button.is-active {
    background: var(--background-primary);
    color: var(--text-normal);
  }

  .keyboard-surface { overflow-x: auto; overflow-y: hidden; width: 100%; }
  #keyboard-layout {
    display: grid;
    position: relative;
    gap: 0px 10px;
    min-width: 696px;
    height: 280px;
    padding: 12px 0 0 0;
    /* grid sizes to content; parent (.keyboard-surface) scrolls horizontally */
  }

  #keyboard-layout > div {
    display: grid;
    grid-template-rows: 0.75fr 1fr 1fr 1fr 1fr 1fr;
    gap: 2px 2px;
  }

  .donation-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  /* Ensure chevron here uses simple collapsed rotation, overriding globals */
  .keyboard-toolbar .chevron {
    display: inline-flex;
    transform: rotate(0deg) !important;
    transition: transform 120ms ease;
  }
  .keyboard-toolbar .chevron.is-collapsed {
    transform: rotate(-90deg) !important;
  }
</style>
