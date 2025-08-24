import {
  type App,
  Plugin,
  type PluginManifest,
  SuggestModal,
  type WorkspaceLeaf,
  setIcon,
  MarkdownView,
} from 'obsidian'
import { mount, unmount } from 'svelte'
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from './Constants'
import ShortcutsView from './views/ShortcutsView'

import QuickViewPopover from './components/QuickViewPopover.svelte'
import CommandsManager from './managers/commandsManager'
import GroupManager from './managers/groupManager'
import HotkeyManager from './managers/hotkeyManager'
import SettingsManager from './managers/settingsManager'

import 'virtual:uno.css'
import './styles.css'
import KeyboardAnalyzerSettingTab from './settingsTab'
import {
  setDevLoggingEnabled,
  setEmulatedOS,
  setLogLevel,
  setKeyboardDevTooltipsEnabled,
} from './utils/runtimeConfig'

export default class KeyboardAnalyzerPlugin extends Plugin {
  commandsManager: CommandsManager
  hotkeyManager: HotkeyManager
  settingsManager: SettingsManager
  groupManager: GroupManager

  // Track dynamically registered per-group commands so we can cleanly resync
  private registeredGroupCommandIds: Set<string> = new Set()

  // Quick View Popover state
  private quickViewComponent: ReturnType<typeof mount> | null = null
  private quickViewAnchorEl: HTMLElement | null = null
  // Track the element that had focus before opening Quick View, so we can restore it
  private quickViewPrevActiveEl: HTMLElement | null = null
  private lastQuickViewInvoke = 0
  private quickViewListenNonce = 0
  private quickViewListeningActive = false
  private lastQuickViewCloseAt = 0
  private quickViewArm: {
    triggers: { modifiers: string[]; key: string }[]
    until: number
  } | null = null

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.settingsManager = SettingsManager.getInstance(this)
    this.groupManager = GroupManager.getInstance(this.settingsManager)
    this.commandsManager = CommandsManager.getInstance(this.app, this)
    this.hotkeyManager = HotkeyManager.getInstance(this.app)
    // Wire managers to avoid runtime require() lookups on hot paths
    this.hotkeyManager.attachCommandsManager(this.commandsManager)
  }

  get full() {
    const leaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )

    const leaf = leaves.length ? leaves[0] : null
    return leaf?.view instanceof ShortcutsView ? leaf.view : null
  }

  async focusView(_type: string) {
    const leafView = this.full
    if (leafView) {
      this.app.workspace.revealLeaf(leafView.leaf)
    }
  }
  // openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)

  async onload() {
    await this.settingsManager.loadSettings()
    try {
      // Ensure persisted groups are hydrated with full filter shapes before use
      this.groupManager.normalizeAllGroups()
    } catch {}
    await this.hotkeyManager.initialize()
    this.commandsManager.initialize()

    // Initialize runtime config from settings
    setDevLoggingEnabled(!!this.settingsManager.getSetting('devLoggingEnabled'))
    setKeyboardDevTooltipsEnabled(!!this.settingsManager.getSetting('keyboardDevTooltipsEnabled'))
    setLogLevel('debug')
    setEmulatedOS(
      (this.settingsManager.getSetting('emulatedOS') || 'none') as
        | 'none'
        | 'windows'
        | 'macos'
        | 'linux'
    )

    this.registerPluginHotkeys()
    this.registerGroupOpenCommand()
    // Initialize any per-group "Open: <Group>" commands (opt-in via group.registerCommand)
    this.syncPerGroupCommands()
    this.addStatusBarIndicator()
    this.addQuickViewCommand()

    this.registerView(
      VIEW_TYPE_SHORTCUTS_ANALYZER,
      (leaf: WorkspaceLeaf) => new ShortcutsView(leaf, this)
    )

    this.addSettingTab(new KeyboardAnalyzerSettingTab(this))

    // This will handle plugin reloads
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace
        .getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
        .forEach((leaf) => {
          if (leaf.view instanceof ShortcutsView) {
            leaf.view.plugin = this // Update the plugin instance
            leaf.view.onOpen() // Re-run onOpen to refresh the view
          }
        })
    })
  }

  async onunload() {
    // Try to flush any pending settings writes to avoid truncated JSON on shutdown
    try {
      await this.settingsManager.flushAllSaves()
    } catch {}
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
  }

  addStatusBarIndicator() {
    const statusBarIcon = this.addStatusBarItem()
    statusBarIcon.addClass('mod-clickable')
    statusBarIcon.setAttribute('aria-label', 'Keyboard Shortcuts')
    statusBarIcon.setAttribute(
      'title',
      'Quick View — Click to open. Cmd/Ctrl+Click opens full view. Alt+Meta splits.'
    )
    statusBarIcon.style.order = '10'
    const icon = statusBarIcon.createSpan('icon')
    setIcon(icon, 'keyboard-glyph')
    // Use the glyph span as an anchor for the Quick View popover
    this.quickViewAnchorEl = icon
    icon.addEventListener('click', (evt) => this.onStatusBarClick(evt))
    // Right-click also toggles Quick View (suppress native menu on the icon only)
    icon.addEventListener('contextmenu', (evt) => {
      evt.preventDefault()
      // Record current focus target before toggling the popover
      try {
        this.quickViewPrevActiveEl =
          document.activeElement as HTMLElement | null
      } catch {}
      if (this.quickViewComponent) this.closeQuickView()
      else this.openQuickView(false)
    })
  }

  async onStatusBarClick(evt: MouseEvent) {
    const isMeta = evt.ctrlKey === true || evt.metaKey === true
    const useSplit = evt.altKey === true

    // Capture previously focused element before any action changes it
    try {
      this.quickViewPrevActiveEl = document.activeElement as HTMLElement | null
    } catch {}

    // Meta/Ctrl click → open full view (Alt+Meta splits)
    if (isMeta) {
      let leafBehavior: boolean | 'split' = false
      leafBehavior = useSplit ? 'split' : true
      this.addShortcutsView(leafBehavior)
      return
    }

    // Default click → toggle Quick View
    if (this.quickViewComponent) {
      this.closeQuickView()
      return
    }
    // Guard against immediate reopen if an outside-click closed it in the same gesture
    if (Date.now() - this.lastQuickViewCloseAt < 200) {
      return
    }
    this.openQuickView(false)
  }

  async addShortcutsView(leafBehavior: boolean | 'split' = false) {
    const existingLeaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )

    if (existingLeaves.length > 0 && !leafBehavior) {
      this.app.workspace.revealLeaf(existingLeaves[0])
      return
    }

    const leaf = this.app.workspace.getLeaf(leafBehavior || false)
    await leaf.setViewState({
      type: VIEW_TYPE_SHORTCUTS_ANALYZER,
      active: true,
    })
  }

  registerPluginHotkeys() {
    this.addCommand({
      id: 'open-shortcuts-analyzer-view',
      name: 'Open keyboard shortcuts view',
      checkCallback: (checking: boolean) => {
        const checkResult =
          this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
            .length === 0

        if (checkResult) {
          // Only perform work when checking is false
          if (!checking) {
            this.addShortcutsView()
            // openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
          }
          return true
        }
      },
    })

    this.addCommand({
      id: 'focus-shortcuts-analyzer-view',
      name: 'Focus keyboard shortcuts view',
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.focusView(VIEW_TYPE_SHORTCUTS_ANALYZER)
        }
        return true
      },
    })
  }

  private registerGroupOpenCommand() {
    this.addCommand({
      id: 'open-keyboard-analyzer-group',
      name: 'Open Keyboard Analyzer: Group…',
      callback: () => this.openGroupPicker(),
    })
  }

  private addQuickViewCommand() {
    this.addCommand({
      id: 'open-quick-view',
      name: 'Open Quick View',
      callback: () => {
        // Capture the currently focused element so we can restore it on close
        try {
          this.quickViewPrevActiveEl =
            document.activeElement as HTMLElement | null
        } catch {}
        const now = Date.now()
        const isDoubleRun = now - this.lastQuickViewInvoke <= 500
        this.lastQuickViewInvoke = now

        if (!this.quickViewComponent) {
          // If we just closed it, do not auto-activate listener on reopen
          const recentlyClosed = now - this.lastQuickViewCloseAt < 250
          this.openQuickView(
            isDoubleRun && !recentlyClosed,
            /*armFromCommand*/ true
          )

          return
        }

        if (isDoubleRun) {
          this.enterQuickViewListenMode()
        } else {
          this.closeQuickView()
        }
      },
    })
  }

  private openQuickView(listenOnOpen = false, armFromCommand = false) {
    try {
      // If we don't already have a recorded focus target, record it now
      if (!this.quickViewPrevActiveEl) {
        try {
          this.quickViewPrevActiveEl =
            document.activeElement as HTMLElement | null
        } catch {}
      }
      // Ensure we have an anchor; fallback to status bar container if not set
      const anchor =
        this.quickViewAnchorEl ||
        (document.querySelector(
          '.status-bar-item.plugin-keyboard-analyzer span.icon'
        ) as HTMLElement | null)
      this.quickViewAnchorEl = anchor || this.quickViewAnchorEl

      if (listenOnOpen) {
        this.quickViewListenNonce++
        this.quickViewListeningActive = true
      } else {
        this.quickViewListeningActive = false
      }

      // If invoked from the command, arm a brief post-open listener trigger:
      // pressing the same hotkey again while holding modifiers will activate listener.
      this.quickViewArm = null
      if (armFromCommand) {
        try {
          const fullId = `${this.manifest.id}:open-quick-view`
          const defaults =
            this.app.hotkeyManager.getDefaultHotkeys(fullId) || []
          const customs =
            (this.app.hotkeyManager.customKeys as any)[fullId] || []
          const map = new Map<string, { modifiers: string[]; key: string }>()
          const toMods = (mods: unknown): string[] => {
            if (Array.isArray(mods)) return mods as string[]
            if (typeof mods === 'string') return mods ? mods.split(',') : []
            return []
          }
          const add = (mods: unknown, key: string) => {
            const m = toMods(mods)
            const sorted = [...m].sort().join(',')
            map.set(`${sorted}|${key}`, { modifiers: m, key })
          }
          for (const hk of defaults)
            add((hk as any).modifiers, (hk as any).key || '')
          for (const hk of customs)
            add((hk as any).modifiers, (hk as any).key || '')
          const triggers = Array.from(map.values())
          if (triggers.length) {
            this.quickViewArm = { triggers, until: Date.now() + 900 }
          }
        } catch {}
      }

      this.quickViewComponent = mount(QuickViewPopover, {
        target: document.body,
        props: {
          plugin: this,
          anchorEl: this.quickViewAnchorEl,
          onClose: (opts?: { restoreFocus?: boolean; reason?: string }) =>
            this.closeQuickView(opts),
          listenToggle: this.quickViewListeningActive
            ? this.quickViewListenNonce
            : 0,
          armTriggers: this.quickViewArm,
        },
      })
    } catch (err) {
      // If mount fails for any reason, clear ref to avoid stale state
      this.quickViewComponent = null
      this.quickViewListeningActive = false
      // Log details in dev mode to surface the true error (helps diagnose "Uncaught" in console)
      try {
        const dev = !!this.settingsManager.getSetting('devLoggingEnabled')
        if (dev) {
          const msg =
            err instanceof Error
              ? `${err.message}\n${err.stack || ''}`
              : String(err)
          console.error('[Keyboard Analyzer] Quick View mount failed:', msg)
        }
      } catch {}
    }
  }

  private closeQuickView(opts?: { restoreFocus?: boolean; reason?: string }) {
    if (this.quickViewComponent) {
      try {
        unmount(this.quickViewComponent)
      } catch {}
      this.quickViewComponent = null
    }
    // Always reset listen flags when closing (Esc, outside click, command toggle, etc.)
    this.quickViewListeningActive = false
    this.lastQuickViewCloseAt = Date.now()
    this.quickViewArm = null

    // Restore focus to the element that previously had it, unless caller opted out
    const shouldRestore = opts?.restoreFocus !== false
    if (shouldRestore) {
      let restored = false
      try {
        const el = this.quickViewPrevActiveEl
        if (el && (el as any).isConnected) {
          ;(el as HTMLElement).focus?.({ preventScroll: true } as any)
          restored = document.activeElement === el
        }
      } catch {}
      // Fallback to focusing active editor (more robust if CM view re-rendered)
      if (!restored) {
        try {
          const md = this.app.workspace.getActiveViewOfType(MarkdownView)
          ;(md as any)?.editor?.focus?.()
        } catch {}
      }
    }
    this.quickViewPrevActiveEl = null
  }

  private enterQuickViewListenMode() {
    if (!this.quickViewComponent) {
      this.openQuickView(true)
      return
    }
    this.quickViewListeningActive = true
    this.quickViewListenNonce++
    try {
      this.quickViewComponent?.update?.({
        listenToggle: this.quickViewListenNonce,
      })
    } catch {
      this.closeQuickView()
      this.openQuickView(true)
    }
  }

  private async openGroupPicker() {
    const plugin = this
    const groups = [
      { id: 'all', name: 'All Commands' },
      ...plugin.settingsManager.settings.commandGroups,
    ]
    class GroupSuggest extends SuggestModal<{ id: string; name: string }> {
      available: { id: string; name: string }[]
      constructor(app: App, items: { id: string; name: string }[]) {
        super(app)
        this.available = items
        this.setPlaceholder('Open group…')
      }
      getSuggestions(query: string) {
        const q = query.toLowerCase().trim()
        return !q
          ? this.available
          : this.available.filter((g) => g.name.toLowerCase().includes(q))
      }
      renderSuggestion(value: { id: string; name: string }, el: HTMLElement) {
        el.setText(value.name)
      }
      onChooseSuggestion(item: { id: string; name: string }) {
        plugin.openWithGroup(item.id)
      }
    }
    const modal = new GroupSuggest(
      this.app,
      groups.map((g) => ({
        id: String(g.id),
        name: g.name,
      }))
    )
    modal.open()
  }

  public async openWithGroup(groupId: string) {
    this.settingsManager.updateSettings({ lastOpenedGroupId: groupId })
    await this.addShortcutsView(false)
  }

  /**
   * Register or refresh per-group commands based on current settings.
   * Only groups with registerCommand === true get a command.
   * Ensures stable ids: "open-group:${group.id}"
   */
  public syncPerGroupCommands(): void {
    // Remove previously registered commands
    for (const fullId of this.registeredGroupCommandIds) {
      try {
        // Full id includes plugin manifest id prefix
        this.app.commands.removeCommand(fullId)
      } catch {
        // ignore
      }
    }
    this.registeredGroupCommandIds.clear()

    const groups = this.settingsManager.getSetting('commandGroups') || []
    for (const g of groups as Array<{
      id: string
      name: string
      registerCommand?: boolean
    }>) {
      if (!g?.registerCommand) continue
      const localId = `open-group:${String(g.id)}`
      const fullId = `${this.manifest.id}:${localId}`

      this.addCommand({
        id: localId,
        name: `Open: ${g.name}`,
        callback: () => this.openWithGroup(String(g.id)),
      })
      this.registeredGroupCommandIds.add(fullId)
    }
  }

  // // Helper methods to access settings
  // async getSetting<K extends keyof PluginSettings>(
  //   key: K
  // ): Promise<PluginSettings[K]> {
  //   return this.settingsManager.getSetting(key)
  // }

  // async setSetting<K extends keyof PluginSettings>(
  //   key: K,
  //   value: PluginSettings[K]
  // ): Promise<void> {
  //   await this.settingsManager.setSetting(key, value)
  // }

  // async updateSettings(newSettings: Partial<PluginSettings>): Promise<void> {
  //   await this.settingsManager.updateSettings(newSettings)
  // }

  // getSettings(): Readonly<PluginSettings> {
  //   return this.settingsManager.getSettings()
  // }

  // END OF PLUGIN DECLARATION
}
