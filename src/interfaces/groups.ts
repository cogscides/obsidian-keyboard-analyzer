// src/interfaces/groups.ts
// Task-aligned data model for User-defined Hotkey Groups (manual).
// This scaffolding aligns with the existing CGroup shape while adding
// optional fields from the task spec for forward compatibility.

import type {
	CGroup,
	CGroupFilterSettings,
	GroupViewState,
	SortOption,
} from "../managers/settingsManager";

/**
 * Alias to existing group filter settings used across the app.
 * Mirrors FilterSettings with any group-specific extensions applied in the future.
 */
export type GroupFilters = CGroupFilterSettings;

/**
 * Versioned HotkeyGroup model (v1).
 * Extends current CGroup persisted shape with optional metadata used by UI/UX:
 * - icon/color for quick visual scanning
 * - description for manager UI
 * - pinned for tabs ordering/visibility
 * - defaults/sort for per-group open behavior and presentation
 * - timestamps and versioning for migrations
 */
export interface HotkeyGroupV1 extends CGroup {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	color?: string;
	pinned?: boolean;
	defaults?: GroupViewState;
	sort?: SortOption;
	createdAt?: number;
	updatedAt?: number;
	version: 1;
}

/**
 * Current HotkeyGroup type alias.
 * Future versions can union discriminated versions if the schema evolves.
 */
export type HotkeyGroup = HotkeyGroupV1;

/**
 * Record map for persisted groups when using id-addressable storage.
 * Not currently used by the app (array is used), but provided for future-proofing.
 */
export type HotkeyGroupsRecord = Record<string, HotkeyGroup>;

/**
 * Narrow type guard to check if an unknown object resembles a HotkeyGroup.
 * Intended for defensive reads and migrations.
 */
export function isHotkeyGroup(value: unknown): value is HotkeyGroup {
	if (!value || typeof value !== "object") return false;
	const v = value as any;
	const hasId = typeof v.id === "string" || typeof v.id === "number";
	const hasName = typeof v.name === "string";
	const hasCommands = Array.isArray(v.commandIds);
	return hasId && hasName && hasCommands;
}
