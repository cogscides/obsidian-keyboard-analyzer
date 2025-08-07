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
</script>

<div
  id="keyboard-layout"
  style:grid-template-columns={gridTemplateColumns}
  style:grid-template-areas={gridTemplateAreas}
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
  <button
    class="donation-badge absolute top-2 right-2"
    onclick={() => window.open('https://ko-fi.com/S6S5E6K74', '_blank')}
    aria-label="Donate"
  >
    <div style="padding-right: 6px;">
      <CoffeeIcon size={16} />
    </div>
    Donate
  </button>
</div>

<style>
  #keyboard-layout {
    display: grid;
    position: relative;
    gap: 0px 10px;
    background-color: var(--background-modifier-border);
    border-radius: 0px 0px 12px 12px;
    border: 1px solid var(--indentation-guide);
    min-width: 720px;
    height: 280px;
    padding: 24px;
  }

  #keyboard-layout > div {
    display: grid;
    grid-template-rows: 0.75fr 1fr 1fr 1fr 1fr 1fr;
    gap: 2px 2px;
  }

  .donation-badge {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
</style>
