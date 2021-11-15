<script lang="ts">
  import type { App } from 'obsidian'
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type { KeyboardAnalizerSettings } from 'src/Interfaces'
  import { getCommands } from 'src/AppShortcuts'
  import { keyboard_svg } from 'src/Constants'

  export let app: App
  export let plugin: KeyboardAnalizerPlugin
  export let settings: KeyboardAnalizerSettings
  export let view: ShortcutsView

  let cmds = getCommands(app)

  $: props = {
    app,
    plugin,
    settings,
    view,
    cmds,
  }
</script>

<div class="markdown-preview-sizer markdown-preview-section">
  <h1>Hello Maaaan 123!</h1>
  <div class="keyboard_svg_wrapper">
    {@html keyboard_svg}
  </div>
  <ul>
    {#each cmds as command, i}
      {#if command.hotkeys != undefined && command.hotkeys.length > 0}
        <li>
          {i}. {command.name}
          {Object.values(command.hotkeys[0].modifiers)} +
          {command.hotkeys[0].key}
        </li>
      {/if}
    {/each}
  </ul>
</div>

<style>
  .keyboard_svg_wrapper {
    width: 100%;
    height: auto;
  }
</style>
