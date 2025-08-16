/** Type declarations for CommandsManager public API */
import type { App } from 'obsidian'
import type { commandEntry } from './Interfaces'

declare class CommandsManager {
  static getInstance(app: App, plugin?: any): CommandsManager
  getCommandsIndex(): Record<string, commandEntry>
  getCommandsList(): commandEntry[]
  ensureSystemShortcutsLoaded(): void
  refreshIndex(): void
  subscribe(cb: (index: Record<string, commandEntry>) => void): () => void
}

export default CommandsManager
export type CommandEntry = commandEntry
