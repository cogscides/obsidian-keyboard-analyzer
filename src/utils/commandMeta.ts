/**
 * Helpers for plugin/command metadata.
 *
 * Minimal, well-typed functions with runtime guards so importing modules can call them safely.
 */

import type { App } from "obsidian";

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
		type PluginsLike = { getPlugin?: (id: string) => unknown };
		const plugins = (app as unknown as { plugins?: PluginsLike }).plugins;
		if (!plugins) return pluginId;

		if (typeof plugins.getPlugin === "function") {
			const p = plugins.getPlugin(pluginId);
			if (p && typeof p === "object") {
				type HasManifest = { manifest?: { name?: string } };
				type Named = { name?: string; displayName?: string };
				const name =
					(p as HasManifest).manifest?.name ||
					(p as Named).name ||
					(p as Named).displayName;
				if (typeof name === "string" && name.length > 0) return name;
			}
		}

		return pluginId;
	} catch {
		return pluginId;
	}
}

/**
 * Heuristic to decide whether a commandId belongs to Obsidian internals.
 * Returns true for command IDs that look namespaced to 'app' or 'workspace' or start with 'app:' or 'workspace:'.
 *
 * @param app - Obsidian App instance (kept for future heuristics)
 * @param commandId - command id string
 */
export function isInternalCommand(_app: App, commandId: string): boolean {
	if (typeof commandId !== "string") return false;
	const id = commandId.toLowerCase().trim();
	if (id.length === 0) return false;

	// Common internal prefixes
	if (
		id.startsWith("app:") ||
		id.startsWith("workspace:") ||
		id.startsWith("editor:")
	)
		return true;

	// Known internal tokens
	if (/\b(app|workspace|core|file|pane|editor)\b/.test(id)) return true;

	return false;
}
