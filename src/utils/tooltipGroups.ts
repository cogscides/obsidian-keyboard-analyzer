// src/utils/tooltipGroups.ts
// Utility for managing tooltip delay groups for better UX

type TooltipGroupManager = {
  activeGroup: string | null
  lastShowTime: number
  groupTimeout: ReturnType<typeof setTimeout> | null
}

class TooltipDelayManager {
  private groups = new Map<string, TooltipGroupManager>()
  private readonly GRACE_PERIOD = 500 // ms to keep group active after last tooltip hide

  /**
   * Check if tooltip should show immediately (no delay) within a group
   */
  shouldShowImmediately(groupId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group || !group.activeGroup) return false

    const timeSinceLastShow = Date.now() - group.lastShowTime
    return timeSinceLastShow < this.GRACE_PERIOD
  }

  /**
   * Register that a tooltip in a group is being shown
   */
  onTooltipShow(groupId: string): void {
    const group = this.groups.get(groupId) || {
      activeGroup: null,
      lastShowTime: 0,
      groupTimeout: null,
    }

    if (group.groupTimeout) {
      clearTimeout(group.groupTimeout)
      group.groupTimeout = null
    }

    group.activeGroup = groupId
    group.lastShowTime = Date.now()
    this.groups.set(groupId, group)
  }

  /**
   * Register that a tooltip in a group is being hidden
   */
  onTooltipHide(groupId: string): void {
    const group = this.groups.get(groupId)
    if (!group) return

    if (group.groupTimeout) {
      clearTimeout(group.groupTimeout)
    }

    // Set a timeout to deactivate the group after grace period
    group.groupTimeout = setTimeout(() => {
      group.activeGroup = null
      group.lastShowTime = 0
    }, this.GRACE_PERIOD)

    this.groups.set(groupId, group)
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    for (const group of this.groups.values()) {
      if (group.groupTimeout) {
        clearTimeout(group.groupTimeout)
      }
    }
    this.groups.clear()
  }
}

// Global instance for use across components
export const tooltipDelayManager = new TooltipDelayManager()

// Common tooltip group IDs
export const TOOLTIP_GROUPS = {
  FILTER_ICONS: 'filter-icons',
  ACTION_ICONS: 'action-icons',
  KEYBOARD_KEYS: 'keyboard-keys',
  TOOLBAR_BUTTONS: 'toolbar-buttons',
  DEVELOPER_OPTIONS: 'developer-options',
} as const

export type TooltipGroupId =
  (typeof TOOLTIP_GROUPS)[keyof typeof TOOLTIP_GROUPS]
