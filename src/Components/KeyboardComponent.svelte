<script lang="ts">
  import type { App } from 'obsidian'
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type { KeyboardAnalizerSettings } from 'src/Interfaces'
  import { keyboard_svg } from 'src/Constants'

  export let app: App
  export let plugin: KeyboardAnalizerPlugin
  export let settings: KeyboardAnalizerSettings
  export let view: ShortcutsView

  $: props = {
    app,
    plugin,
    settings,
    view,
  }
</script>

<div class="markdown-preview-sizer markdown-preview-section">
  <h1>Hello Maaaan 123!</h1>
  <div class="keyboard_svg_wrapper">
    {@html keyboard_svg}
  </div>
  This app: {props.app}
  plugin: {props.plugin}
  settings: {props.settings}
  view: {props.view}
</div>

<style>
  .keyboard_svg_wrapper {
    width: 100%;
    height: auto;
  }
</style>
