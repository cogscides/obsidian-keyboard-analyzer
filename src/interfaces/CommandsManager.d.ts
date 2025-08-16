/** Type declarations for CommandsManager public API */
import type { App } from 'obsidian'
import type { commandEntry } from './Interfaces'

/**
 * Minimal exported interface describing the public surface consumers rely on.
 * This allows other modules to import the shape without importing the concrete class.
 */
export interface CommandsManagerAPI {
  getCommandsIndex(): Record<string, commandEntry>
  getCommandsList(): commandEntry[]
  ensureSystemShortcutsLoaded(): void
  refreshIndex(): void
  subscribe(cb: (index: Record<string, commandEntry>) => void): () => void
}

declare class CommandsManager implements CommandsManagerAPI {
  static getInstance(app: App, plugin?: unknown): CommandsManager
  getCommandsIndex(): Record<string, commandEntry>
  getCommandsList(): commandEntry[]
  ensureSystemShortcutsLoaded(): void
  refreshIndex(): void
  subscribe(cb: (index: Record<string, commandEntry>) => void): () => void
}

export default CommandsManager
export type CommandEntry = commandEntry
