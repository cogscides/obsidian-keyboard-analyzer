/**
 * Helpers for plugin/command metadata.
 *
 * Minimal, well-typed functions with runtime guards so importing modules can call them safely.
 */

import type { App } from 'obsidian'

/**
 * Return plugin display name if found in app.plugins; otherwise return the pluginId.
 *
 * @param app - Obsidian App instance (from src/types/obsidian-augmentations.d.ts)
 * @param pluginId - plugin id string
 * @returns plugin name or pluginId fallback
 */
export function getPluginName(app: App, pluginId: string): string {
  try {
    // runtime-guard: app.plugins?.getPlugin may be provided via augmentations.
    const plugins = (app as any).plugins
    if (!plugins) return pluginId

    if (typeof plugins.getPlugin === 'function') {
      const p = plugins.getPlugin(pluginId)
      if (p && typeof p === 'object') {
        const name =
          (p.manifest && (p.manifest as any).name) ||
          (p as any).name ||
          (p as any).displayName
        if (typeof name === 'string' && name.length > 0) return name
      }
    }

    return pluginId
  } catch {
    return pluginId
  }
}

/**
 * Heuristic to decide whether a commandId belongs to Obsidian internals.
 * Returns true for command IDs that look namespaced to 'app' or 'workspace' or start with 'app:' or 'workspace:'.
 *
 * @param app - Obsidian App instance (kept for future heuristics)
 * @param commandId - command id string
 */
export function isInternalCommand(app: App, commandId: string): boolean {
  if (typeof commandId !== 'string') return false
  const id = commandId.toLowerCase().trim()
  if (id.length === 0) return false

  // Common internal prefixes
  if (
    id.startsWith('app:') ||
    id.startsWith('workspace:') ||
    id.startsWith('editor:')
  )
    return true

  // Known internal tokens
  if (/\b(app|workspace|core|file|pane|editor)\b/.test(id)) return true

  return false
}
