import logger from "../../utils/logger";
// groupManager.ts
import type SettingsManager from "../settingsManager";
import type {
	CGroup,
	CGroupFilterSettings,
	GroupViewState,
} from "../settingsManager";

export enum GroupType {
	All = "all",
	Featured = "featured",
	Recent = "recent",
}

export const DEFAULT_GROUP_NAMES = {
	[GroupType.All]: "All Commands",
	[GroupType.Featured]: "Featured",
	[GroupType.Recent]: "Recent",
};

export default class GroupManager {
	private static instance: GroupManager | null = null;
	private settingsManager: SettingsManager;
	public groups: CGroup[] = $derived.by(
		() => this.settingsManager.settings.commandGroups,
	);

	// Prevent re-entrant writes that can cause reactive thrash/infinite loops
	private writeLocks: Set<string> = new Set();

	private constructor(settingsManager: SettingsManager) {
		this.settingsManager = settingsManager;
		// Normalize persisted groups to ensure full filter shape and safe defaults/last-used
		this.normalizeAllGroups();
	}

	static getInstance(settingsManager: SettingsManager): GroupManager {
		if (!GroupManager.instance) {
			GroupManager.instance = new GroupManager(settingsManager);
		}
		return GroupManager.instance;
	}

	getGroups(): CGroup[] {
		return this.groups;
	}

	getGroup(groupId: string): CGroup | undefined {
		return this.groups.find((g) => g.id === groupId);
	}

	createGroup(groupName: string): string {
		const id = this.slugifyUnique(groupName);
		const newGroup: CGroup = {
			id,
			name: groupName,
			commandIds: [],
			excludedModules: [],
			filterSettings: {
				...this.settingsManager.settings.defaultFilterSettings,
			},
		};
		this.settingsManager.updateSettings({
			commandGroups: [...this.groups, newGroup],
		});
		return id;
	}

	removeGroup(groupId: string): void {
		this.settingsManager.updateSettings({
			commandGroups: this.groups.filter((g) => g.id !== groupId),
		});
	}

	duplicateGroup(sourceGroupId: string, newName?: string): string | undefined {
		const src = this.getGroup(sourceGroupId);
		if (!src) return undefined;
		const name = newName?.trim() || `${src.name} Copy`;
		const id = this.slugifyUnique(name);
		const clone: CGroup = {
			id,
			name,
			commandIds: [...(src.commandIds || [])],
			excludedModules: [...(src.excludedModules || [])],
			filterSettings: { ...src.filterSettings },
		};
		this.settingsManager.updateSettings({
			commandGroups: [...this.groups, clone],
		});
		return id;
	}

	addCommandToGroup(groupId: string, commandId: string): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId && !group.commandIds.includes(commandId)) {
				return { ...group, commandIds: [...group.commandIds, commandId] };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/** Insert a command at a specific index within a group (bounds clamped). */
	insertCommandInGroup(
		groupId: string,
		commandId: string,
		index: number,
	): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId && !group.commandIds.includes(commandId)) {
				const next = [...group.commandIds];
				const clamped = Math.max(0, Math.min(index, next.length));
				next.splice(clamped, 0, commandId);
				return { ...group, commandIds: next };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/** Convenience: add command at the top (index 0). */
	addCommandToGroupAtTop(groupId: string, commandId: string): void {
		this.insertCommandInGroup(groupId, commandId, 0);
	}

	removeCommandFromAllGroups(commandId: string): void {
		const updatedGroups = this.groups.map((group) => ({
			...group,
			commandIds: group.commandIds.filter((id) => id !== commandId),
		}));
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	getFeaturedCommandsByGroup(groupId: string): string[] {
		const group = this.getGroup(groupId);
		// filter commands in group by featuredCommandIDs from settings
		return (
			group?.commandIds.filter((id) =>
				this.settingsManager.settings.featuredCommandIDs.includes(id),
			) || []
		);
	}

	removeCommandFromGroup(groupId: string, commandId: string): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				return {
					...group,
					commandIds: group.commandIds.filter((id) => id !== commandId),
				};
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	renameGroup(groupId: string, newName: string): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				return { ...group, name: newName };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/** Utility: does a given group contain the command id? */
	isCommandInGroup(groupId: string, commandId: string): boolean {
		const g = this.getGroup(groupId);
		return !!g && g.commandIds.includes(commandId);
	}

	getGroupSettings(groupId: string): CGroupFilterSettings {
		const group = this.getGroup(groupId);
		const base = this.settingsManager.settings.defaultFilterSettings;
		const settings = group?.filterSettings || base;
		return { ...base, ...settings };
	}

	setGroupSetting(
		groupId: string,
		key: keyof CGroupFilterSettings,
		value: boolean,
	): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				return {
					...group,
					filterSettings: { ...group.filterSettings, [key]: value },
				};
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	updateGroupFilterSettings(
		groupId: string,
		newSettings: Partial<CGroupFilterSettings>,
	): void {
		try {
			if (this.writeLocks.has(groupId)) {
				logger.debug("[groups] updateGroupFilterSettings skipped (locked)", {
					groupId,
				});
				return;
			}
			// Update in place if group exists
			const currentGroups = this.groups;
			const groupIndex = currentGroups.findIndex((g) => g.id === groupId);
			if (groupIndex !== -1) {
				const updated = [...currentGroups];
				const prev = updated[groupIndex];
				const base = this.settingsManager.settings.defaultFilterSettings;
				const nextFilters: CGroupFilterSettings = {
					...base,
					...(prev.filterSettings || {}),
					...newSettings,
				};

				// Skip write if nothing actually changed to avoid rerender loops
				if (
					this.isEqualFilters(
						prev.filterSettings as CGroupFilterSettings,
						nextFilters,
					)
				) {
					logger.debug("[groups] updateGroupFilterSettings noop (no change)", {
						groupId,
					});
					return;
				}

				const nextGroup: CGroup = {
					...prev,
					filterSettings: nextFilters,
					// If behavior is dynamic, snapshot "lastUsedState" on every change
					...(prev.behavior?.onOpen === "dynamic"
						? {
								lastUsedState: {
									...(prev.lastUsedState || {}),
									filters: { ...nextFilters },
								} as GroupViewState,
							}
						: {}),
				};
				this.writeLocks.add(groupId);
				updated[groupIndex] = nextGroup;
				this.settingsManager.updateSettings({ commandGroups: updated });
				// Release lock on next tick to let reactive graph settle
				setTimeout(() => this.writeLocks.delete(groupId), 0);
				return;
			}

			// Fallback: if group doesn't exist (e.g., default "all" group), update global defaults
			const updatedDefaults = {
				...this.settingsManager.settings.defaultFilterSettings,
				...newSettings,
			};
			this.settingsManager.updateSettings({
				defaultFilterSettings: updatedDefaults,
			});
		} catch (err) {
			logger.error("[groups] updateGroupFilterSettings failed", {
				groupId,
				newSettings,
				err,
			});
		}
	}

	toggleFilterSetting(groupId: string, key: keyof CGroupFilterSettings): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				return {
					...group,
					filterSettings: {
						...group.filterSettings,
						[key]: !group.filterSettings[key],
					},
				};
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	getExcludedModulesForGroup(groupId: string): string[] {
		const group = this.getGroup(groupId);
		return group?.excludedModules || [];
	}

	toggleExcludedModuleForGroup(groupId: string, moduleId: string): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				const index = group.excludedModules.indexOf(moduleId);
				const newExcludedModules =
					index !== -1
						? group.excludedModules.filter((id) => id !== moduleId)
						: [...group.excludedModules, moduleId];
				return { ...group, excludedModules: newExcludedModules };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/**
	 * Reorder commands within a manual group by moving an item from one index to another.
	 * Persists the updated order to settings.
	 */
	moveCommandInGroup(
		groupId: string,
		fromIndex: number,
		toIndex: number,
	): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				const ids = [...group.commandIds];
				if (
					fromIndex < 0 ||
					fromIndex >= ids.length ||
					toIndex < 0 ||
					toIndex >= ids.length
				) {
					return group;
				}
				const [moved] = ids.splice(fromIndex, 1);
				ids.splice(toIndex, 0, moved);
				return { ...group, commandIds: ids };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/**
	 * Replace the entire command order for a manual group with the provided list.
	 * Unknown ids are filtered out; missing ids are ignored.
	 */
	setGroupCommandOrder(groupId: string, orderedIds: string[]): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				const set = new Set(group.commandIds);
				const next = orderedIds.filter((id) => set.has(id));
				return { ...group, commandIds: next };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/** Replace the group's filters entirely. Useful for applying saved defaults/last-used. */
	replaceGroupFilters(groupId: string, filters: CGroupFilterSettings): void {
		try {
			if (this.writeLocks.has(groupId)) {
				logger.debug("[groups] replaceGroupFilters skipped (locked)", {
					groupId,
				});
				return;
			}
			const base = this.settingsManager.settings.defaultFilterSettings;
			const updatedGroups = this.groups.map((group) => {
				if (group.id === groupId) {
					const merged = {
						...base,
						...(filters || ({} as CGroupFilterSettings)),
					};

					// Skip write if no actual change
					if (
						this.isEqualFilters(
							group.filterSettings as CGroupFilterSettings,
							merged,
						)
					) {
						return group;
					}

					const next: CGroup = {
						...group,
						filterSettings: merged,
						...(group.behavior?.onOpen === "dynamic"
							? {
									lastUsedState: {
										...(group.lastUsedState || {}),
										filters: { ...merged },
									} as GroupViewState,
								}
							: {}),
					};
					return next;
				}
				return group;
			});
			this.writeLocks.add(groupId);
			this.settingsManager.updateSettings({ commandGroups: updatedGroups });
			setTimeout(() => this.writeLocks.delete(groupId), 0);
		} catch (err) {
			logger.error("[groups] replaceGroupFilters failed", { groupId, err });
		}
	}



	/** Set/overwrite group's saved defaults. Only fields provided are updated. */
	setGroupDefaults(groupId: string, state: Partial<GroupViewState>): void {
		try {
			const base = this.settingsManager.settings.defaultFilterSettings;
			const updatedGroups = this.groups.map((group) => {
				if (group.id === groupId) {
					const prev = group as unknown as { defaults?: GroupViewState };
					const prevDefaults = prev.defaults;
					const nextDefaults: GroupViewState = {
						...(prevDefaults || { filters: { ...group.filterSettings } }),
						...(state as GroupViewState),
						// Always include filters object if missing
						filters: {
							...base,
							...(prevDefaults?.filters ||
								(group.filterSettings as CGroupFilterSettings)),
							...(state.filters || {}),
						} as CGroupFilterSettings,
					};

					// Skip write if defaults already identical
					if (
						prevDefaults &&
						this.isEqualFilters(
							prevDefaults.filters as CGroupFilterSettings,
							nextDefaults.filters as CGroupFilterSettings,
						)
					) {
						logger.debug("[groups] setGroupDefaults noop (no change)", {
							groupId,
						});
						return group;
					}

					logger.debug("[groups] setGroupDefaults", {
						groupId,
						filters: nextDefaults.filters,
					});
					return { ...group, defaults: nextDefaults };
				}
				return group;
			});
			this.settingsManager.updateSettings({ commandGroups: updatedGroups });
		} catch (err) {
			logger.error("[groups] setGroupDefaults failed", { groupId, state, err });
		}
	}

	/** Apply saved defaults into current filters (if present). */
	applyDefaultsToGroupFilters(groupId: string): void {
		try {
			const g = this.getGroup(groupId);
			const defaults: GroupViewState | undefined = g?.defaults;
			if (defaults?.filters) {
				const base = this.settingsManager.settings.defaultFilterSettings;
				this.replaceGroupFilters(groupId, {
					...base,
					...(defaults.filters as CGroupFilterSettings),
				});
			} else {
				logger.debug("[groups] no defaults to apply", { groupId });
			}
		} catch (err) {
			logger.error("[groups] applyDefaultsToGroupFilters failed", {
				groupId,
				err,
			});
		}
	}

	/** Apply lastUsedState into current filters when available (dynamic fallback). */
	applyDynamicLastUsedToGroupFilters(groupId: string): void {
		try {
			if (this.writeLocks.has(groupId)) return;
			const g = this.getGroup(groupId);
			const last: GroupViewState | undefined = g?.lastUsedState;
			if (last?.filters) {
				const base = this.settingsManager.settings.defaultFilterSettings;
				this.replaceGroupFilters(groupId, {
					...base,
					...(last.filters as CGroupFilterSettings),
				});
			} else {
				logger.debug("[groups] no lastUsedState to apply", { groupId });
			}
		} catch (err) {
			logger.error("[groups] applyDynamicLastUsedToGroupFilters failed", {
				groupId,
				err,
			});
		}
	}

	/** Shallow-equality check for filter settings to avoid redundant writes. */
	private isEqualFilters(
		a: CGroupFilterSettings | undefined,
		b: CGroupFilterSettings | undefined,
	): boolean {
		const base = this.settingsManager.settings.defaultFilterSettings;
		const keys = Object.keys(base) as Array<keyof CGroupFilterSettings>;
		for (const k of keys) {
			if (Boolean(a?.[k]) !== Boolean(b?.[k])) return false;
		}
		return true;
	}

	/** Reorder the groups array to persist custom order in UI. */
	moveGroup(fromIndex: number, toIndex: number): void {
		const current = [...this.groups];
		if (
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= current.length ||
			toIndex >= current.length
		) {
			return;
		}
		const [moved] = current.splice(fromIndex, 1);
		current.splice(toIndex, 0, moved);
		this.settingsManager.updateSettings({ commandGroups: current });
	}

	/** Enable or disable per-group dynamic command registration for a group. */
	setGroupRegisterCommand(groupId: string, register: boolean): void {
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				return { ...group, registerCommand: !!register };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/** Normalize all groups to include a complete filterSettings object and hydrated defaults/lastUsedState. */
	public normalizeAllGroups(): void {
		const base = this.settingsManager.settings.defaultFilterSettings;
		const nextGroups = this.groups.map((g) => {
			const normalizedFilters: CGroupFilterSettings = {
				...base,
				...(g.filterSettings || ({} as CGroupFilterSettings)),
			};

			// Normalize optional defaults snapshot if present
			const prevDefaults = g.defaults;
			const normalizedDefaults = prevDefaults
				? ({
						...prevDefaults,
						filters: {
							...base,
							...(prevDefaults.filters || normalizedFilters),
						} as CGroupFilterSettings,
					} as GroupViewState)
				: undefined;

			// Normalize optional last-used snapshot if present
			const prevLast = g.lastUsedState;
			const normalizedLastUsed = prevLast
				? ({
						...prevLast,
						filters: {
							...base,
							...(prevLast.filters || normalizedFilters),
						} as CGroupFilterSettings,
					} as GroupViewState)
				: undefined;

			const groupOut: CGroup = {
				...g,
				filterSettings: normalizedFilters,
			};
			const withDefaults = normalizedDefaults
				? { ...groupOut, defaults: normalizedDefaults }
				: groupOut;
			const withLastUsed = normalizedLastUsed
				? { ...withDefaults, lastUsedState: normalizedLastUsed }
				: withDefaults;
			return withLastUsed;
		});

		try {
			if (JSON.stringify(nextGroups) !== JSON.stringify(this.groups)) {
				this.settingsManager.updateSettings({ commandGroups: nextGroups });
			}
		} catch {
			// Fall back to writing normalized groups if diffing fails
			this.settingsManager.updateSettings({ commandGroups: nextGroups });
		}
	}

	/** Get group's onOpen behavior; allow 'all' as a special pseudo-group. */
	getGroupBehavior(groupId: string): "default" | "dynamic" {
		if (groupId === GroupType.All) {
			return (this.settingsManager.settings.allGroupOnOpen || "default") as
				"default" | "dynamic";
		}
		const g = this.getGroup(groupId);
		return g?.behavior?.onOpen === "dynamic" ? "dynamic" : "default";
	}

	/** Set group's onOpen behavior; allow 'all' to store in settings. */
	setGroupBehavior(groupId: string, mode: "default" | "dynamic"): void {
		if (groupId === GroupType.All) {
			this.settingsManager.updateSettings({ allGroupOnOpen: mode });
			return;
		}
		const updatedGroups = this.groups.map((group) => {
			if (group.id === groupId) {
				const behavior = { ...(group.behavior || {}), onOpen: mode };
				return { ...group, behavior };
			}
			return group;
		});
		this.settingsManager.updateSettings({ commandGroups: updatedGroups });
	}

	/** Store defaults snapshot for the implicit All Commands group. */
	setAllGroupDefaults(state: Partial<GroupViewState>): void {
		try {
			const base = this.settingsManager.settings.defaultFilterSettings;
			const filters: CGroupFilterSettings = {
				...(base as CGroupFilterSettings),
				...((state?.filters as CGroupFilterSettings) || ({} as CGroupFilterSettings)),
			};
			// Store in simple filters key to avoid nested state issues; defer write to next tick to avoid flush conflicts
			setTimeout(() => {
				this.settingsManager.updateSettings({
					allGroupDefaultFilters: { ...filters },
				});
			}, 0);
		} catch (err) {
			logger.error("[groups] setAllGroupDefaults failed", { state, err });
		}
	}

	/** Apply saved All Commands defaults into global defaultFilterSettings. */
	applyDefaultsToAllFilters(): void {
		try {
			const filters =
				(this.settingsManager.settings.allGroupDefaultFilters as CGroupFilterSettings | undefined) ||
				((this.settingsManager.settings.allGroupDefaults as GroupViewState | undefined)?.filters as
					CGroupFilterSettings | undefined);
			if (filters) {
				const base = this.settingsManager.settings.defaultFilterSettings;
				const nextFilters: CGroupFilterSettings = {
					...base,
					...filters,
				};
				// Skip write if no actual change to avoid effect loops
				if (this.isEqualFilters(base as CGroupFilterSettings, nextFilters)) {
					return;
				}
				this.settingsManager.updateSettings({
					defaultFilterSettings: nextFilters,
				});
			} else {
				logger.debug("[groups] no allGroupDefaults to apply");
			}
		} catch (err) {
			logger.error("[groups] applyDefaultsToAllFilters failed", { err });
		}
	}

	private slugifyUnique(name: string): string {
		const base =
			name
				.toLowerCase()
				.trim()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, "")
				.slice(0, 60) || "group";
		let id = base;
		let i = 1;
		const existing = new Set(this.groups.map((g) => String(g.id)));
		while (existing.has(id)) {
			id = `${base}-${i++}`;
		}
		return id;
	}
}

// OLD GROUP MANAGER

// export default class GroupManager implements IGroupManager {
//   private settingsManager: ISettingsManager
//   public groups: CGroup[] = $state([])

//   constructor(settingsManager: ISettingsManager) {
//     this.settingsManager = settingsManager
//     this.initializeGroups()
//   }

//   private initializeGroups(): void {
//     const existingGroups = this.settingsManager.getSetting('commandGroups')
//     if (!existingGroups || existingGroups.length === 0) {
//       this.createDefaultGroups()
//     }
//   }

//   private createDefaultGroups(): void {
//     const defaultGroups = Object.entries(DEFAULT_GROUP_NAMES).map(
//       ([id, name]) => ({
//         id,
//         name,
//         commandIds: [],
//         excludedModules: [],
//         filterSettings: this.settingsManager.getSetting(
//           'defaultFilterSettings'
//         ),
//       })
//     )
//     this.settingsManager.updateSettings({ commandGroups: defaultGroups })
//   }

//   getGroups(): CGroup[] {
//     return this.settingsManager.getSetting('commandGroups')
//   }

//   getGroup(groupID: string): CGroup | undefined {
//     return this.getGroups().find((group) => group.id === groupID)
//   }

//   createGroup(groupName: string): void {
//     const groups = this.getGroups()
//     const sanitizedGroupName = groupName.replace(' ', '-').toLowerCase()
//     if (!groups.some((group) => group.id === sanitizedGroupName)) {
//       groups.push({
//         id: sanitizedGroupName,
//         name: groupName,
//         commandIds: [],
//         excludedModules: [],
//         filterSettings: this.settingsManager.getSetting(
//           'defaultFilterSettings'
//         ),
//       })
//       this.settingsManager.updateSettings({ commandGroups: groups })
//     }
//   }

//   removeGroup(groupID: string): void {
//     const groups = this.getGroups().filter((g) => g.id !== groupID)
//     this.settingsManager.updateSettings({ commandGroups: groups })
//   }

//   addCommandToGroup(groupID: string, commandId: string): void {
//     const groups = this.getGroups()
//     const group = groups.find((g) => g.id === groupID)
//     if (group && !group.commandIds.includes(commandId)) {
//       group.commandIds.push(commandId)
//       this.settingsManager.updateSettings({ commandGroups: groups })
//     }
//   }

//   removeCommandFromGroup(groupID: string, commandId: string): void {
//     const groups = this.getGroups()
//     const group: CGroup | undefined = groups.find((g) => g.id === groupID)
//     if (group) {
//       group.commandIds = group.commandIds.filter(
//         (id: string) => id !== commandId
//       )
//       this.settingsManager.updateSettings({ commandGroups: groups })
//     }
//   }

//   getGroupSettings(groupID: string): CGroupSettings | undefined {
//     return this.getGroup(groupID)?.filterSettings
//   }

//   setGroupSetting(
//     groupID: string,
//     key: keyof CGroupSettings,
//     value: boolean
//   ): void {
//     const groups = this.getGroups()
//     const group = groups.find((g) => g.id === groupID)
//     if (group) {
//       group.filterSettings[key] = value
//       this.settingsManager.updateSettings({ commandGroups: groups })
//     }
//   }

//   isCommandInGroup(groupID: string, commandId: string): boolean {
//     const group = this.getGroup(groupID)
//     return group ? group.commandIds.includes(commandId) : false
//   }

//   getExcludedModulesForGroup(groupID: string): string[] {
//     return this.getGroup(groupID)?.excludedModules || []
//   }

//   toggleExcludedModuleForGroup(groupID: string, moduleID: string): void {
//     const groups = this.getGroups()
//     const group = groups.find((g) => g.id === groupID)
//     if (group) {
//       const excludedModules = group.excludedModules || []
//       const index = excludedModules.indexOf(moduleID)
//       if (index !== -1) {
//         excludedModules.splice(index, 1)
//       } else {
//         excludedModules.push(moduleID)
//       }
//       group.excludedModules = excludedModules
//       this.settingsManager.updateSettings({ commandGroups: groups })
//     }
//   }

//   updateGroupSettings(groupID: string, newSettings: Partial<CGroup>): void {
//     const groups = this.getGroups()
//     const groupIndex = groups.findIndex((g) => g.id === groupID)
//     if (groupIndex !== -1) {
//       groups[groupIndex] = { ...groups[groupIndex], ...newSettings }
//       this.settingsManager.updateSettings({ commandGroups: groups })
//     }
//   }
// }
