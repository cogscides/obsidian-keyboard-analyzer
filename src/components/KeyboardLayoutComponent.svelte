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
  import KeyboardKey from '../Components/KeyboardKey.svelte'
  import { Coffee as CoffeeIcon, Pin as PinIcon, Settings as SettingsIcon } from 'lucide-svelte'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte'
  import type CommandsManager from '../managers/commandsManager'
  import { GroupType } from '../managers/groupManager/groupManager.svelte'

  interface Props {
    visibleCommands: commandEntry[]
  }

  let { visibleCommands = [] }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager',
  )
  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')
  import type SettingsManager from '../managers/settingsManager'
  const settingsManager: SettingsManager = plugin.settingsManager
  const commandsManager: CommandsManager = plugin.commandsManager
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
    const commands = heatmapScope === 'all'
      ? commandsManager.getCommandsForGroup(GroupType.All)
      : visibleCommands
    visualKeyboardManager.calculateAndAssignWeights(commands)
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
  let isPinned = $state(Boolean(settingsManager.getSetting('pinKeyboardPanel')))
  let heatmapScope: 'filtered' | 'all' = $state('filtered')
  let devMenuOpen = $state(false)
  let showInspector = $state(false)
  // Reflect live settings values
  const devOptionsEnabled = $derived(
    Boolean(settingsManager.settings.enableDeveloperOptions)
  )
  let devLoggingEnabled = $derived(
    Boolean(settingsManager.settings.devLoggingEnabled)
  )
  let emulatedOS = $derived(
    (settingsManager.settings.emulatedOS || 'none') as 'none' | 'windows' | 'macos' | 'linux'
  )
  import { setDevLoggingEnabled, setEmulatedOS } from '../utils/runtimeConfig'
</script>

<div class="keyboard-panel {panelCollapsed ? 'collapsed' : ''} {isPinned ? 'pinned' : ''}">
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
        {#if !panelCollapsed}
          <button
            class="scope-toggle"
            aria-label="Toggle heatmap scope"
            aria-pressed={heatmapScope === 'all'}
            title={heatmapScope === 'filtered' ? 'Heatmap matches current filters/search' : 'Heatmap counts all commands'}
            onclick={() => (heatmapScope = heatmapScope === 'filtered' ? 'all' : 'filtered')}
          >
            <span class="scope-label">Show:</span>
            <span class="scope-value">{heatmapScope === 'filtered' ? 'Filtered' : 'All'}</span>
          </button>
        {/if}
    </div>
    <div class="toolbar-right">
      {#if devOptionsEnabled}
        <div class="dev-menu">
          <button
            class="dev-gear"
            aria-haspopup="true"
            aria-expanded={devMenuOpen}
            title="Developer options"
            onclick={() => (devMenuOpen = !devMenuOpen)}
          >
            <SettingsIcon size={16} />
          </button>
          {#if devMenuOpen}
            <div class="dev-dropdown" role="menu">
              <div class="dev-item">
                <label>
                  <input
                    type="checkbox"
                    checked={devLoggingEnabled}
                    oninput={(e: Event) => {
                      const v = (e.currentTarget as HTMLInputElement).checked
                      settingsManager.updateSettings({ devLoggingEnabled: v })
                      setDevLoggingEnabled(v)
                    }}
                  />
                  <span>Dev logging</span>
                </label>
              </div>
              <div class="dev-item">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(settingsManager.settings.useBakedKeyNames)}
                    oninput={(e: Event) => {
                      const v = (e.currentTarget as HTMLInputElement).checked
                      settingsManager.updateSettings({ useBakedKeyNames: v })
                    }}
                  />
                  <span>Use baked key names</span>
                </label>
              </div>
              <div class="dev-item">
                <button class="link" onclick={() => (showInspector = !showInspector)}>
                  {showInspector ? 'Hide' : 'Show'} Active Keys inspector
                </button>
              </div>
              <div class="dev-item">
                <label class="inline" for="kbd-emu-os-select">Emulated OS:</label>
                <select
                  id="kbd-emu-os-select"
                  bind:value={emulatedOS}
                  oninput={(e: Event) => {
                    const val = (e.currentTarget as HTMLSelectElement).value as 'none'|'windows'|'macos'|'linux'
                    settingsManager.updateSettings({ emulatedOS: val })
                    setEmulatedOS(val)
                  }}
                >
                  <option value="none">None</option>
                  <option value="windows">Windows</option>
                  <option value="macos">macOS</option>
                  <option value="linux">Linux</option>
                </select>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      <button
        class="pin-toggle"
        aria-label={isPinned ? 'Unpin keyboard panel' : 'Pin keyboard panel'}
        aria-pressed={isPinned}
        title={isPinned ? 'Unpin from top' : 'Pin to top'}
        onclick={() => {
          isPinned = !isPinned
          settingsManager.updateSettings({ pinKeyboardPanel: isPinned })
        }}
      >
        <PinIcon size={16} />
        <span class="pin-label">{isPinned ? 'Unpin' : 'Pin'}</span>
      </button>
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

    {#if showInspector}
      <div class="dev-inspector" aria-live="polite">
        <div class="dev-row"><span class="k">Active key:</span><span class="v">{activeKeysStore.getDisplayKey() || '—'}</span></div>
        <div class="dev-row"><span class="k">Modifiers:</span><span class="v">{activeKeysStore.ActiveModifiers.length ? activeKeysStore.ActiveModifiers.join(' + ') : '—'}</span></div>
      </div>
    {/if}

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
    display: block; /* sticky works reliably on block-level */
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

  /* Single scope toggle button */
  .scope-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-modifier-form-field);
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
  }
  .scope-toggle:hover,
  .scope-toggle:focus-visible {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
  }
  .scope-toggle .scope-label { margin-right: 4px; color: var(--text-muted); }
  .scope-toggle .scope-value { color: var(--text-normal); font-weight: 600; }

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

  /* Developer menu */
  .dev-menu { position: relative; }
  .dev-gear {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-modifier-form-field);
    color: var(--text-muted);
    cursor: pointer;
  }
  .dev-gear:hover, .dev-gear:focus-visible {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
  }
  .dev-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    box-shadow: var(--shadow-s);
    padding: 8px;
    min-width: 220px;
    z-index: 1000;
  }
  .dev-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 2px; }
  .dev-item .inline { margin-right: auto; color: var(--text-muted); }
  .dev-item .link { background: none; border: none; color: var(--interactive-accent); cursor: pointer; padding: 0; }
  .dev-item select { width: 120px; }

  .dev-inspector {
    margin: 8px 0 0 0;
    padding: 6px 8px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    font-size: 12px;
  }
  .dev-inspector .dev-row { display: flex; gap: 8px; line-height: 1.4; }
  .dev-inspector .k { color: var(--text-muted); min-width: 84px; }
  .dev-inspector .v { color: var(--text-normal); font-weight: 600; }

  .pin-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-modifier-form-field);
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
  }
  .pin-toggle:hover,
  .pin-toggle:focus-visible {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
  }

  .keyboard-panel.pinned {
    position: sticky;
    top: 0;
    z-index: 20;
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
