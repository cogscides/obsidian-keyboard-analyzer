import 'obsidian'
import type {
  UnsafeCommands,
  UnsafeHotkeyManager,
  UnsafeInternalPlugin,
} from '../interfaces/Interfaces'

declare module 'obsidian' {
  interface App {
    commands: UnsafeCommands
    hotkeyManager: UnsafeHotkeyManager
    plugins: { plugins: Record<string, { manifest: { name: string; id?: string } }> }
    internalPlugins: {
      getEnabledPlugins(): UnsafeInternalPlugin[]
      getPluginById(id: string): { instance: { options: { pinned: [] } } }
    }
  }
}
