<script lang="ts">
  import type { App } from 'obsidian'
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type { KeyboardAnalizerSettings } from 'src/Interfaces'

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

<div>
  <h1>Hello Maaaan!</h1>
  This app: {props.app}
  plugin: {props.plugin}
  settings: {props.settings}
  view: {props.view}
</div>

<style>
</style>
