/**
 * Runtime key sets for view/filter settings.
 * These mirror the enum definitions in settingsManager.d.ts
 * but are emitted at runtime so Svelte components can iterate over them.
 */

export const FilterSettingsKeyValues = {
  StrictModifierMatch: 'StrictModifierMatch',
  ViewWOhotkeys: 'ViewWOhotkeys',
  OnlyCustom: 'OnlyCustom',
  OnlyDuplicates: 'OnlyDuplicates',
  FeaturedFirst: 'FeaturedFirst',
  HighlightCustom: 'HighlightCustom',
  HighlightDuplicates: 'HighlightDuplicates',
  HighlightBuiltIns: 'HighlightBuiltIns',
  DisplayIDs: 'DisplayIDs',
  ShowPluginBadges: 'ShowPluginBadges',
  GroupByPlugin: 'GroupByPlugin',
  DisplayGroupAssignment: 'DisplayGroupAssignment',
  DisplayInternalModules: 'DisplayInternalModules',
  DisplaySystemShortcuts: 'DisplaySystemShortcuts',
} as const

export type FilterSettingsKey =
  (typeof FilterSettingsKeyValues)[keyof typeof FilterSettingsKeyValues]

export const ViewSettingsKeyValues = {
  FeaturedFirst: 'FeaturedFirst',
  GroupByPlugin: 'GroupByPlugin',
  HighlightCustom: 'HighlightCustom',
  HighlightDuplicates: 'HighlightDuplicates',
  DisplayIDs: 'DisplayIDs',
  HighlightBuiltIns: 'HighlightBuiltIns',
  ShowPluginBadges: 'ShowPluginBadges',
} as const

export type ViewSettingsKey =
  (typeof ViewSettingsKeyValues)[keyof typeof ViewSettingsKeyValues]
