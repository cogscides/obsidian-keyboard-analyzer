export interface PluginSettings {
  showStatusBarItem: boolean
  defaultFilterSettings: FilterSettings
  filters: {
    isUnifiedAcrossGroups: boolean
    filterSettings: FilterSettings
  }
  featuredCommandIDs: string[]
  commandGroups: CGroup[]
  pinKeyboardPanel?: boolean
  // Developer options (non-breaking defaults)
  enableDeveloperOptions?: boolean
  devLoggingEnabled?: boolean
  emulatedOS?: 'none' | 'windows' | 'macos' | 'linux'
}

export enum FilterSettingsKeys {
  StrictModifierMatch = 'StrictModifierMatch',
  ViewWOhotkeys = 'ViewWOhotkeys',
  OnlyCustom = 'OnlyCustom',
  OnlyDuplicates = 'OnlyDuplicates',
  FeaturedFirst = 'FeaturedFirst',
  HighlightBuiltIns = 'HighlightBuiltIns',
  GroupByPlugin = 'GroupByPlugin',
  HighlightCustom = 'HighlightCustom',
  HighlightDuplicates = 'HighlightDuplicates',
  DisplayIDs = 'DisplayIDs',
  ShowPluginBadges = 'ShowPluginBadges',
  DisplayGroupAssignment = 'DisplayGroupAssignment',
  DisplayInternalModules = 'DisplayInternalModules',
  DisplaySystemShortcuts = 'DisplaySystemShortcuts',
}

// View/presentation-related subset to separate UI concerns from filtering
export enum ViewSettingsKeys {
  FeaturedFirst = 'FeaturedFirst',
  GroupByPlugin = 'GroupByPlugin',
  HighlightCustom = 'HighlightCustom',
  HighlightDuplicates = 'HighlightDuplicates',
  DisplayIDs = 'DisplayIDs',
  HighlightBuiltIns = 'HighlightBuiltIns',
  ShowPluginBadges = 'ShowPluginBadges',
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
