export interface PluginSettings {
  showStatusBarItem: boolean
  defaultFilterSettings: FilterSettings
  filters: {
    isUnifiedAcrossGroups: boolean
    filterSettings: FilterSettings
  }
  featuredCommandIDs: string[]
  commandGroups: CGroup[]
  lastOpenedGroupId?: string
  pinKeyboardPanel?: boolean
  keyboardCollapsed?: boolean
  // Developer options (non-breaking defaults)
  enableDeveloperOptions?: boolean
  devLoggingEnabled?: boolean
  emulatedOS?: 'none' | 'windows' | 'macos' | 'linux'
  // Debuggable presentation toggle for key display names
  useBakedKeyNames?: boolean

  /**
   * Persisted height for the Quick View popover (in px). Allows user-resizable popover.
   */
  quickViewHeight?: number
  /**
   * Persisted width for the Quick View popover (in px). Allows left-edge resizing.
   */
  quickViewWidth?: number

  /**
   * Settings schema/migration version.
   * Undefined or 0 implies legacy data; current schema is 1+ when groups are present.
   */
  settingsSchemaVersion?: number
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
  // Behavior on open: 'default' applies saved defaults; 'dynamic' restores last used state
  behavior?: { onOpen: 'default' | 'dynamic' }
  // Persisted per-group last used UI state (used when behavior.onOpen === 'dynamic')
  lastUsedState?: GroupViewState
  // Optional: register a per-group command (e.g., "Open: <GroupName>")
  registerCommand?: boolean
}

export interface CGroupFilterSettings extends FilterSettings {}

export enum GroupType {
  All = 'all',
  Featured = 'featured',
  Recent = 'recent',
}

/**
 * Sort options for list rendering. Kept minimal until full sort UI exists.
 */
export type SortOption = 'none' | 'alpha' | 'plugin'

/**
 * Snapshot of UI state for a group. Mirrors accepted fields for "Default vs Dynamic" behavior.
 * Extend as additional view state becomes available (e.g., layout toggles).
 */
export interface GroupViewState {
  viewMode?: 'keyboard' | 'list'
  filters: CGroupFilterSettings
  sort?: SortOption
  heatmapScope?: 'filtered' | 'all'
}
