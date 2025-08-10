// groupManager.ts
import type SettingsManager from '../settingsManager'
import type {
  CGroup,
  CGroupFilterSettings,
  FilterSettings,
} from '../settingsManager'

export enum GroupType {
  All = 'all',
  Featured = 'featured',
  Recent = 'recent',
}

export const DEFAULT_GROUP_NAMES = {
  [GroupType.All]: 'All Commands',
  [GroupType.Featured]: 'Featured',
  [GroupType.Recent]: 'Recent',
}

export default class GroupManager {
  private static instance: GroupManager | null = null
  private settingsManager: SettingsManager
  public groups: CGroup[] = $derived.by(
    () => this.settingsManager.settings.commandGroups
  )

  private constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager
  }

  static getInstance(settingsManager: SettingsManager): GroupManager {
    if (!GroupManager.instance) {
      GroupManager.instance = new GroupManager(settingsManager)
    }
    return GroupManager.instance
  }

  getGroups(): CGroup[] {
    return this.groups
  }

  getGroup(groupId: string): CGroup | undefined {
    return this.groups.find((g) => g.id === groupId)
  }

  createGroup(groupName: string): string {
    const id = this.slugifyUnique(groupName)
    const newGroup: CGroup = {
      id,
      name: groupName,
      commandIds: [],
      excludedModules: [],
      filterSettings: {
        ...this.settingsManager.settings.defaultFilterSettings,
      },
    }
    this.settingsManager.updateSettings({
      commandGroups: [...this.groups, newGroup],
    })
    return id
  }

  removeGroup(groupId: string): void {
    this.settingsManager.updateSettings({
      commandGroups: this.groups.filter((g) => g.id !== groupId),
    })
  }

  duplicateGroup(sourceGroupId: string, newName?: string): string | undefined {
    const src = this.getGroup(sourceGroupId)
    if (!src) return undefined
    const name = (newName && newName.trim()) || `${src.name} Copy`
    const id = this.slugifyUnique(name)
    const clone: CGroup = {
      id,
      name,
      commandIds: [...(src.commandIds || [])],
      excludedModules: [...(src.excludedModules || [])],
      filterSettings: { ...src.filterSettings },
    }
    this.settingsManager.updateSettings({ commandGroups: [...this.groups, clone] })
    return id
  }

  addCommandToGroup(groupId: string, commandId: string): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId && !group.commandIds.includes(commandId)) {
        return { ...group, commandIds: [...group.commandIds, commandId] }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  /** Insert a command at a specific index within a group (bounds clamped). */
  insertCommandInGroup(groupId: string, commandId: string, index: number): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId && !group.commandIds.includes(commandId)) {
        const next = [...group.commandIds]
        const clamped = Math.max(0, Math.min(index, next.length))
        next.splice(clamped, 0, commandId)
        return { ...group, commandIds: next }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  /** Convenience: add command at the top (index 0). */
  addCommandToGroupAtTop(groupId: string, commandId: string): void {
    this.insertCommandInGroup(groupId, commandId, 0)
  }

  removeCommandFromAllGroups(commandId: string): void {
    const updatedGroups = this.groups.map((group) => ({
      ...group,
      commandIds: group.commandIds.filter((id) => id !== commandId),
    }))
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  getFeaturedCommandsByGroup(groupId: string): string[] {
    const group = this.getGroup(groupId)
    // filter commands in group by featuredCommandIDs from settings
    return (
      group?.commandIds.filter((id) =>
        this.settingsManager.settings.featuredCommandIDs.includes(id)
      ) || []
    )
  }

  removeCommandFromGroup(groupId: string, commandId: string): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          commandIds: group.commandIds.filter((id) => id !== commandId),
        }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  renameGroup(groupId: string, newName: string): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId) {
        return { ...group, name: newName }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  /** Utility: does a given group contain the command id? */
  isCommandInGroup(groupId: string, commandId: string): boolean {
    const g = this.getGroup(groupId)
    return !!g && g.commandIds.includes(commandId)
  }

  getGroupSettings(groupId: string): CGroupFilterSettings {
    const group = this.getGroup(groupId)
    const settings =
      group?.filterSettings ||
      this.settingsManager.settings.defaultFilterSettings
    return settings
  }

  setGroupSetting(
    groupId: string,
    key: keyof CGroupFilterSettings,
    value: boolean
  ): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          filterSettings: { ...group.filterSettings, [key]: value },
        }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  updateGroupFilterSettings(
    groupId: string,
    newSettings: Partial<CGroupFilterSettings>
  ): void {
    // Update in place if group exists
    const currentGroups = this.groups
    const groupIndex = currentGroups.findIndex((g) => g.id === groupId)
    if (groupIndex !== -1) {
      const updated = [...currentGroups]
      updated[groupIndex] = {
        ...updated[groupIndex],
        filterSettings: {
          ...updated[groupIndex].filterSettings,
          ...newSettings,
        },
      }
      this.settingsManager.updateSettings({ commandGroups: updated })
      return
    }

    // Fallback: if group doesn't exist (e.g., default "all" group), update defaults
    const updatedDefaults = {
      ...this.settingsManager.settings.defaultFilterSettings,
      ...newSettings,
    }
    this.settingsManager.updateSettings({
      defaultFilterSettings: updatedDefaults,
    })
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
        }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  getExcludedModulesForGroup(groupId: string): string[] {
    const group = this.getGroup(groupId)
    return group?.excludedModules || []
  }

  toggleExcludedModuleForGroup(groupId: string, moduleId: string): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId) {
        const index = group.excludedModules.indexOf(moduleId)
        const newExcludedModules =
          index !== -1
            ? group.excludedModules.filter((id) => id !== moduleId)
            : [...group.excludedModules, moduleId]
        return { ...group, excludedModules: newExcludedModules }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  /**
   * Reorder commands within a manual group by moving an item from one index to another.
   * Persists the updated order to settings.
   */
  moveCommandInGroup(groupId: string, fromIndex: number, toIndex: number): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId) {
        const ids = [...group.commandIds]
        if (
          fromIndex < 0 ||
          fromIndex >= ids.length ||
          toIndex < 0 ||
          toIndex >= ids.length
        ) {
          return group
        }
        const [moved] = ids.splice(fromIndex, 1)
        ids.splice(toIndex, 0, moved)
        return { ...group, commandIds: ids }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  /**
   * Replace the entire command order for a manual group with the provided list.
   * Unknown ids are filtered out; missing ids are ignored.
   */
  setGroupCommandOrder(groupId: string, orderedIds: string[]): void {
    const updatedGroups = this.groups.map((group) => {
      if (group.id === groupId) {
        const set = new Set(group.commandIds)
        const next = orderedIds.filter((id) => set.has(id))
        return { ...group, commandIds: next }
      }
      return group
    })
    this.settingsManager.updateSettings({ commandGroups: updatedGroups })
  }

  /** Reorder the groups array to persist custom order in UI. */
  moveGroup(fromIndex: number, toIndex: number): void {
    const current = [...this.groups]
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= current.length ||
      toIndex >= current.length
    ) {
      return
    }
    const [moved] = current.splice(fromIndex, 1)
    current.splice(toIndex, 0, moved)
    this.settingsManager.updateSettings({ commandGroups: current })
  }

  private slugifyUnique(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .slice(0, 60)
      || 'group'
    let id = base
    let i = 1
    const existing = new Set(this.groups.map((g) => String(g.id)))
    while (existing.has(id)) {
      id = `${base}-${i++}`
    }
    return id
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
