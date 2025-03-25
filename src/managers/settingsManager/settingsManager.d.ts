export interface PluginSettings {
  showStatusBarItem: boolean
  defaultFilterSettings: FilterSettings
  filters: {
    isUnifiedAcrossGroups: boolean
    filterSettings: FilterSettings
  }
  featuredCommandIDs: string[]
  commandGroups: CGroup[]
}

export enum FilterSettingsKeys {
  StrictModifierMatch = 'StrictModifierMatch',
  ViewWOhotkeys = 'ViewWOhotkeys',
  FeaturedFirst = 'FeaturedFirst',
  GroupByPlugin = 'GroupByPlugin',
  HighlightCustom = 'HighlightCustom',
  HighlightDuplicates = 'HighlightDuplicates',
  DisplayIDs = 'DisplayIDs',
  DisplayGroupAssignment = 'DisplayGroupAssignment',
  DisplayInternalModules = 'DisplayInternalModules',
}

type FilterSettings = {
  [key in FilterSettingsKeys]: boolean
}

type CGroupSettingTitles = {
  [key in FilterSettingsKeys]: string
}

export interface CGroup {
  id: string | GroupType // This is the sanitized group name
  name: string // This is the original group name
  commandIds: string[]
  excludedModules: string[]
  filterSettings: CGroupFilterSettings
}

export interface CGroupFilterSettings extends FilterSettings {}

export enum GroupType {
  All = 'all',
  Featured = 'featured',
  Recent = 'recent',
}
