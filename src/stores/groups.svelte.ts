// src/stores/groups.svelte.ts
// Thin Svelte store wrapper around GroupManager to expose reactive groups and
// delegate CRUD/behavior methods. This keeps a single source of truth while
// enabling components to use a store-like API.

import type GroupManager from '../managers/groupManager'
import type {
  CGroup,
  CGroupFilterSettings,
  GroupViewState,
} from '../managers/settingsManager'

export interface GroupsStore {
  // Reactive groups list (kept in sync with settings via GroupManager)
  groups: CGroup[]

  // Read helpers
  getGroups(): CGroup[]
  getGroup(id: string): CGroup | undefined

  // CRUD
  createGroup(name: string): string
  duplicateGroup(sourceId: string, newName?: string): string | undefined
  renameGroup(id: string, newName: string): void
  removeGroup(id: string): void
  moveGroup(fromIndex: number, toIndex: number): void

  // Membership
  isCommandInGroup(groupId: string, commandId: string): boolean
  addCommandToGroup(groupId: string, commandId: string): void
  addCommandToGroupAtTop(groupId: string, commandId: string): void
  removeCommandFromGroup(groupId: string, commandId: string): void
  removeCommandFromAllGroups(commandId: string): void
  moveCommandInGroup(groupId: string, fromIndex: number, toIndex: number): void
  setGroupCommandOrder(groupId: string, orderedIds: string[]): void

  // Filters/settings
  getGroupSettings(groupId: string): CGroupFilterSettings
  updateGroupFilterSettings(
    groupId: string,
    newSettings: Partial<CGroupFilterSettings>
  ): void
  replaceGroupFilters(groupId: string, filters: CGroupFilterSettings): void

  // Behavior and defaults
  getGroupBehavior(groupId: string): 'default' | 'dynamic'
  setGroupBehavior(groupId: string, mode: 'default' | 'dynamic'): void
  setGroupDefaults(groupId: string, state: Partial<GroupViewState>): void
  applyDefaultsToGroupFilters(groupId: string): void
  applyDynamicLastUsedToGroupFilters(groupId: string): void
  setGroupRegisterCommand(groupId: string, register: boolean): void

  // New methods for managing unsaved changes
  hasUnsavedFilterChanges(groupId: string): boolean
  saveCurrentFiltersAsDefaults(groupId: string): void
  resetFiltersToDefaults(groupId: string): void

  // Utilities
  normalizeAllGroups(): void
  getExcludedModulesForGroup(groupId: string): string[]
  toggleExcludedModuleForGroup(groupId: string, moduleId: string): void
}

/**
 * Factory to create a store-like wrapper around an existing GroupManager.
 * Components can pass plugin.groupManager to obtain this store.
 */
export function createGroupsStore(groupManager: GroupManager): GroupsStore {
  // Keep a reactive reference to groups. The $derived.by rune is available in .svelte.ts files.
  const _groups = $derived.by(() => groupManager.getGroups())

  return {
    get groups() {
      // expose reactive getter
      void groupManager.groups
      return groupManager.getGroups()
    },

    // Read
    getGroups: () => groupManager.getGroups(),
    getGroup: (id: string) => groupManager.getGroup(id),

    // CRUD
    createGroup: (name: string) => groupManager.createGroup(name),
    duplicateGroup: (sourceId: string, newName?: string) =>
      groupManager.duplicateGroup(sourceId, newName),
    renameGroup: (id: string, newName: string) =>
      groupManager.renameGroup(id, newName),
    removeGroup: (id: string) => groupManager.removeGroup(id),
    moveGroup: (fromIndex: number, toIndex: number) =>
      groupManager.moveGroup(fromIndex, toIndex),

    // Membership
    isCommandInGroup: (groupId: string, commandId: string) =>
      groupManager.isCommandInGroup(groupId, commandId),
    addCommandToGroup: (groupId: string, commandId: string) =>
      groupManager.addCommandToGroup(groupId, commandId),
    addCommandToGroupAtTop: (groupId: string, commandId: string) =>
      groupManager.addCommandToGroupAtTop(groupId, commandId),
    removeCommandFromGroup: (groupId: string, commandId: string) =>
      groupManager.removeCommandFromGroup(groupId, commandId),
    removeCommandFromAllGroups: (commandId: string) =>
      groupManager.removeCommandFromAllGroups(commandId),
    moveCommandInGroup: (groupId: string, fromIndex: number, toIndex: number) =>
      groupManager.moveCommandInGroup(groupId, fromIndex, toIndex),
    setGroupCommandOrder: (groupId: string, orderedIds: string[]) =>
      groupManager.setGroupCommandOrder(groupId, orderedIds),

    // Filters/settings
    getGroupSettings: (groupId: string) =>
      groupManager.getGroupSettings(groupId),
    updateGroupFilterSettings: (
      groupId: string,
      newSettings: Partial<CGroupFilterSettings>
    ) => groupManager.updateGroupFilterSettings(groupId, newSettings),
    replaceGroupFilters: (groupId: string, filters: CGroupFilterSettings) =>
      groupManager.replaceGroupFilters(groupId, filters),

    // Behavior and defaults
    getGroupBehavior: (groupId: string) =>
      groupManager.getGroupBehavior(groupId),
    setGroupBehavior: (groupId: string, mode: 'default' | 'dynamic') =>
      groupManager.setGroupBehavior(groupId, mode),
    setGroupDefaults: (groupId: string, state: Partial<GroupViewState>) =>
      groupManager.setGroupDefaults(groupId, state),
    applyDefaultsToGroupFilters: (groupId: string) =>
      groupManager.applyDefaultsToGroupFilters(groupId),
    applyDynamicLastUsedToGroupFilters: (groupId: string) =>
      groupManager.applyDynamicLastUsedToGroupFilters(groupId),
    setGroupRegisterCommand: (groupId: string, register: boolean) =>
      groupManager.setGroupRegisterCommand(groupId, register),

    // New methods for managing unsaved changes
    hasUnsavedFilterChanges: (groupId: string) =>
      groupManager.hasUnsavedFilterChanges(groupId),
    saveCurrentFiltersAsDefaults: (groupId: string) =>
      groupManager.saveCurrentFiltersAsDefaults(groupId),
    resetFiltersToDefaults: (groupId: string) =>
      groupManager.resetFiltersToDefaults(groupId),

    // Utilities
    normalizeAllGroups: () => groupManager.normalizeAllGroups(),
    getExcludedModulesForGroup: (groupId: string) =>
      groupManager.getExcludedModulesForGroup(groupId),
    toggleExcludedModuleForGroup: (groupId: string, moduleId: string) =>
      groupManager.toggleExcludedModuleForGroup(groupId, moduleId),
  }
}
