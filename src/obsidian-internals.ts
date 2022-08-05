import 'obsidian'

declare module 'obsidian' {
  interface HotKeyManager {
    getHotkeys(id: string): Hotkey[]
    getDefaultHotkeys(id: string): Hotkey[]
    customKeys: { [id: string]: Hotkey[] }
  }
  interface App {
    commands: Commands
    hotkeyManager: HotKeyManager
  }
  interface Commands {
    commands: Record<string, Command>
    addCommand(cmd: Command): void
    removeCommand(cmd: Command): void
  }
}
