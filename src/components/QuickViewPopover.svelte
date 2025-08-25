<script lang="ts">
  import { onDestroy, onMount, setContext } from 'svelte'
  import {
    useFloating,
    flip,
    shift,
    offset,
  } from '@skeletonlabs/floating-ui-svelte'
  import clickOutside from '../utils/clickOutside.js'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import type KeyboardAnalyzerPlugin from '../main'
  import { VisualKeyboardManager } from '../managers'
  import { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import {
    convertModifiers,
    unconvertModifiers,
    unconvertModifier,
    matchHotkey,
    normalizeKey,
    platformizeModifiers,
    sortModifiers,
  } from '../utils/modifierUtils'
  import {
    formatHotkeyBaked,
    getBakedKeyLabel,
    getBakedModifierLabel,
  } from '../utils/normalizeKeyDisplay'
  import { CircleDot as CircleDotIcon, X } from 'lucide-svelte'
  import { Scope } from 'obsidian'
  import GroupSelector from './GroupSelector.svelte'
  import logger from '../utils/logger'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    anchorEl?: HTMLElement | null
    onClose?: (opts?: { restoreFocus?: boolean; reason?: string }) => void
    listenToggle?: number
    armTriggers?: {
      triggers: { modifiers: string[]; key: string }[]
      until: number
    } | null
  }

  let {
    plugin,
    anchorEl = null,
    onClose = () => {},
    listenToggle = 0,
    armTriggers = null,
  }: Props = $props()

  const commandsManager = plugin.commandsManager
  const settingsManager = plugin.settingsManager
  const groupManager = plugin.groupManager

  // Early init logs and error capture to catch pre-mount issues
  logger.debug('[qv] script:init')
  try {
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'error',
        (ev: ErrorEvent) => {
          try {
            const data = {
              message: ev.message,
              filename: ev.filename,
              lineno: ev.lineno,
              colno: ev.colno,
              error: ev.error instanceof Error ? ev.error.message : String(ev.error ?? ''),
            }
            logger.error('[qv] early window error', data)
          } catch {
            // swallow logging failures
          }
        },
        { once: true }
      )
      window.addEventListener(
        'unhandledrejection',
        (ev: PromiseRejectionEvent) => {
          try {
            logger.error('[qv] early unhandledrejection', ev.reason)
          } catch {
            // swallow logging failures
          }
        },
        { once: true }
      )
    }
  } catch {
    // ignore early init errors
  }
  // Provide plugin for children that expect it via context (GroupSelector)
  try {
    setContext('keyboard-analyzer-plugin', plugin)
    logger.debug('[qv] init context provided')
  } catch (err) {
    logger.error('[qv] context set failed', err)
  }

  // Core state
  let search = $state('')
  let listenerActive = $state(false)
  let selectedGroup = $state('all')
  try {
    const sg =
      (settingsManager.getSetting('lastOpenedGroupId') as string) || 'all'
    selectedGroup = sg
  } catch (err) {
    logger.error('[qv] read lastOpenedGroupId failed', err)
  }

  // Keys state via ActiveKeysStore (init on mount to avoid pre-mount side effects)
  let visualKeyboardManager: VisualKeyboardManager | null = $state(null)
  let activeKeysStore: ActiveKeysStore | null = $state(null)
  let activeKey = $state('')
  let activeModifiers: string[] = $state([])

  // Results
  let filtered: commandEntry[] = $state([])
  let selectedIndex = $state(0)
  let listEl: HTMLDivElement | null = $state(null)
  let inputEl: HTMLInputElement | null = $state(null)

  // Persisted size and anchoring
  let rootEl: HTMLDivElement | null = $state(null)
  let placeAbove = $state(false)

  // Floating UI setup for smart positioning
  const floating = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(6), // 6px margin from anchor
      flip(), // Auto-flip when near viewport edges
      shift({ padding: 8 }), // Shift to stay within viewport
    ],
  })

  // Start with safe defaults; read persisted size on mount
  let coords = $state({
    top: 0,
    left: 0,
    width: 380,
    height: 360,
  })
  let anchorOffsetX = $state(0)
  let isResizing = false
  let suppressOutsideCloseUntil = 0
  // Default true; load persisted value on mount
  let autoRun = $state(true)
  let pinned = $state(false)
  let keyScope: Scope | null = null
  let mounted = $state(false)
  // removed non-reactive capture of selectedGroup

  // Refilter based on state
  function refilter() {
    const base = commandsManager.filterCommands(
      search,
      convertModifiers(activeModifiers),
      activeKey,
      selectedGroup
    )
    filtered = base.slice(0, 200)
    selectedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1))
  }

  // Removed reactive listenToggle effect to avoid re-entrant updates.

  // Positioning near status bar icon
  let recomputeQueued = false
  function scheduleRecompute() {
    if (recomputeQueued) return
    recomputeQueued = true
    requestAnimationFrame(() => {
      recomputeQueued = false
      try {
        recomputePosition()
      } catch (err) {
        logger.error('[qv] recomputePosition:raf error', err)
      }
    })
  }
  function recomputePosition() {
    try {
      logger.debug('[qv] recomputePosition:start')
      if (!rootEl || !anchorEl || isResizing) return

      // Use floating-ui for positioning when available and not resizing
      if (floating.isPositioned && !isResizing) {
        const floatingStyles = floating.floatingStyles
        // Parse the floating styles to get computed position
        const transformMatch = floatingStyles.match(
          /translate3d\(([^,]+),\s*([^,]+),/
        )
        if (transformMatch) {
          const floatingLeft = parseFloat(transformMatch[1])
          const floatingTop = parseFloat(transformMatch[2])

          // Use floating-ui position but respect our custom width/height
          const next = {
            ...coords,
            top: floatingTop,
            left: floatingLeft,
          }

          const changed = next.top !== coords.top || next.left !== coords.left
          if (changed) {
            queueMicrotask(() => {
              coords = next
              anchorOffsetX = next.left - anchorEl.getBoundingClientRect().left
              logger.debug('[qv] recomputePosition:end (floating-ui)', {
                coords,
              })
            })
          }
          return
        }
      }

      // Fallback to original positioning logic
      const rect = anchorEl.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const vw = window.innerWidth || document.documentElement.clientWidth
      const margin = 6
      const desiredTop = rect.bottom + margin
      const capH = Math.floor(vh * 0.6)
      const estH = Math.min(capH, Math.max(240, coords.height))
      const fitsBelow = desiredTop + estH <= vh
      const nextPlaceAbove = !fitsBelow
      const top = nextPlaceAbove
        ? Math.max(8, rect.top - margin - estH)
        : Math.min(vh - estH - 8, desiredTop)
      let left = anchorOffsetX ? rect.left + anchorOffsetX : rect.left
      let width = coords.width || rootEl.offsetWidth || 360
      const maxW = Math.max(430, Math.floor(vw * 0.92))
      if (width > maxW) width = maxW
      if (left + width > vw - 8) left = Math.max(8, vw - width - 8)
      if (left < 8) left = 8
      const next = { ...coords, top, left, width }
      const changed =
        next.top !== coords.top ||
        next.left !== coords.left ||
        next.width !== coords.width ||
        nextPlaceAbove !== placeAbove
      if (changed) {
        // Defer state writes to next microtask to avoid nested update depth
        queueMicrotask(() => {
          placeAbove = nextPlaceAbove
          coords = next
          anchorOffsetX = left - rect.left
          logger.debug('[qv] recomputePosition:end (fallback)', { coords })
        })
      } else {
        anchorOffsetX = left - rect.left
        logger.debug('[qv] recomputePosition:end (fallback)', { coords })
      }
    } catch (err) {
      logger.error('[qv] recomputePosition:error', err)
    }
  }

  // Corner resize (top-left)
  let resizingCorner = false
  let startCX = 0,
    startCY = 0,
    startLeft = 0,
    startTop = 0,
    startW = 0,
    startH = 0
  function onCornerDown(e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    resizingCorner = true
    isResizing = true
    startCX = e.clientX
    startCY = e.clientY
    startLeft = coords.left
    startTop = coords.top
    startW = coords.width
    startH = coords.height
    suppressOutsideCloseUntil = Date.now() + 250
    logger.debug('[qv] resize:corner:down', {
      startLeft,
      startTop,
      startW,
      startH,
    })
    window.addEventListener('pointermove', onCornerMove, true)
    window.addEventListener('pointerup', onCornerUp, true)
  }
  function onCornerMove(e: PointerEvent) {
    if (!resizingCorner) return
    const dx = e.clientX - startCX
    const dy = e.clientY - startCY
    let left = startLeft + dx
    let top = startTop + dy
    let width = startW - dx
    let height = startH - dy
    const minW = 430,
      minH = 240
    const vw = window.innerWidth || document.documentElement.clientWidth
    const vh = window.innerHeight || document.documentElement.clientHeight
    const maxH = Math.floor(vh * 0.6)
    const maxW = Math.floor(vw * 0.92)
    if (width < minW) {
      left = startLeft + (startW - minW)
      width = minW
    }
    if (width > maxW) {
      width = maxW
      left = Math.min(left, vw - 8 - width)
    }
    if (left < 8) {
      left = 8
      width = Math.max(minW, Math.min(startW - (startLeft - 8), vw - 16))
    }
    if (left + width > vw - 8) width = Math.max(minW, vw - 8 - left)
    if (height < minH) {
      height = minH
      top = startTop + (startH - minH)
    }
    if (height > maxH) {
      height = maxH
      top = Math.max(8, startTop - (maxH - startH))
    }
    if (top < 8) {
      const delta = 8 - top
      top = 8
      height = Math.min(maxH, Math.max(minH, height - delta))
    }
    if (top + height > vh - 8) {
      const overflow = top + height - (vh - 8)
      height = Math.max(minH, height - overflow)
    }
    coords = { ...coords, left, top, width, height }
    logger.debug('[qv] resize:corner:move', { left, top, width, height })
    try {
      if (anchorEl)
        anchorOffsetX = coords.left - anchorEl.getBoundingClientRect().left
    } catch {
      // ignore anchor read during resize
    }
    settingsManager.updateSettings({
      quickViewWidth: width,
      quickViewHeight: height,
    })
  }
  function onCornerUp() {
    if (!resizingCorner) return
    resizingCorner = false
    isResizing = false
    suppressOutsideCloseUntil = Date.now() + 120
    logger.debug('[qv] resize:corner:up', coords)
    window.removeEventListener('pointermove', onCornerMove, true)
    window.removeEventListener('pointerup', onCornerUp, true)
  }

  // Left-edge width resize (optional but handy)
  let resizingLeft = false
  let startLX = 0,
    startLLeft = 0,
    startLW = 0
  function onLeftDown(e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    resizingLeft = true
    isResizing = true
    startLX = e.clientX
    startLLeft = coords.left
    startLW = coords.width
    suppressOutsideCloseUntil = Date.now() + 250
    logger.debug('[qv] resize:left:down', { startLLeft, startLW })
    window.addEventListener('pointermove', onLeftMove, true)
    window.addEventListener('pointerup', onLeftUp, true)
  }
  function onLeftMove(e: PointerEvent) {
    if (!resizingLeft) return
    const dx = e.clientX - startLX
    let left = startLLeft + dx
    let width = startLW - dx
    const minW = 430
    const vw = window.innerWidth || document.documentElement.clientWidth
    const maxW = Math.floor(vw * 0.92)
    if (width < minW) {
      width = minW
      left = startLLeft + (startLW - minW)
    }
    if (width > maxW) {
      width = maxW
      left = Math.min(left, vw - 8 - width)
    }
    if (left < 8) {
      left = 8
      width = Math.max(minW, Math.min(startLW - (startLLeft - 8), vw - 16))
    }
    if (left + width > vw - 8) width = Math.max(minW, vw - 8 - left)
    coords = { ...coords, left, width }
    logger.debug('[qv] resize:left:move', { left, width })
    try {
      if (anchorEl)
        anchorOffsetX = coords.left - anchorEl.getBoundingClientRect().left
    } catch {
      // ignore activeKeysStore errors
    }
    settingsManager.updateSettings({ quickViewWidth: width })
  }
  function onLeftUp() {
    if (!resizingLeft) return
    resizingLeft = false
    isResizing = false
    suppressOutsideCloseUntil = Date.now() + 120
    logger.debug('[qv] resize:left:up', coords)
    window.removeEventListener('pointermove', onLeftMove, true)
    window.removeEventListener('pointerup', onLeftUp, true)
  }

  // Keyboard handling and selection
  function clampIndex(n: number): number {
    const max = Math.max(0, filtered.length - 1)
    if (max === 0) return 0
    if (n < 0) return max
    if (n > max) return 0
    return n
  }
  function moveSelection(delta: number) {
    selectedIndex = clampIndex(selectedIndex + delta)
    // ensure visible
    queueMicrotask(() => {
      const rows = listEl?.querySelectorAll<HTMLElement>('.qv-row')
      const el = rows?.[selectedIndex]
      el?.scrollIntoView({ block: 'nearest' })
    })
  }
  function runSelected() {
    const cmd = filtered[selectedIndex]
    if (!cmd) return
    try {
      plugin.app.commands.executeCommandById(cmd.id)
      commandsManager.addRecentCommand(cmd.id)
    } catch {}
    if (!pinned) onClose?.({ restoreFocus: true, reason: 'run-selected' })
  }

  function onKeydownGlobal(e: KeyboardEvent) {
    if (!rootEl) return
    const inside = rootEl.contains(e.target as Node)

    // Allow Esc to act even if focus isn't inside the popover
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
      if (listenerActive) {
        listenerActive = false
        return
      }
      // Even when pinned, Esc should close the popover
      onClose?.({ restoreFocus: true, reason: 'escape' })
      return
    }
    // Global Mod+F: prevent propagation; focus input first; only toggle when input is focused
    const modFGlobal =
      (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') &&
      (e.metaKey || e.ctrlKey)
    if (modFGlobal) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
      if (document.activeElement !== inputEl) {
        inputEl?.focus()
      } else {
        listenerActive = !listenerActive
      }
      return
    }

    // If listener is active, capture keys even if focus moved (e.g., after running a command)
    if (listenerActive) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
      // While listening, allow navigation and run/close via keyboard
      if (e.key === 'ArrowDown') {
        moveSelection(1)
        return
      }
      if (e.key === 'ArrowUp') {
        moveSelection(-1)
        return
      }
      if (e.key === 'Tab') {
        moveSelection(e.shiftKey ? -1 : 1)
        return
      }
      if (e.key === 'Enter') {
        if (autoRun) runSelected()
        return
      }
      try {
        activeKeysStore?.handlePhysicalKeyDown(e, { inActiveView: true })
      } catch {
        // ignore key handling errors
      }
      activeKey = activeKeysStore?.ActiveKey || ''
      activeModifiers = unconvertModifiers(
        activeKeysStore?.ActiveModifiers || []
      )
      refilter()
      return
    }

    // Arm trigger: if just opened by command, pressing the same hotkey again toggles listener
    if (armTriggers && Date.now() < armTriggers.until) {
      try {
        const activeMods: string[] = []
        if (e.ctrlKey) activeMods.push('Control')
        if (e.metaKey) activeMods.push('Meta')
        if (e.altKey) activeMods.push('Alt')
        if (e.shiftKey) activeMods.push('Shift')
        const aKey = normalizeKey(e.code || e.key || '')
        const hit = armTriggers.triggers.some(t =>
          matchHotkey(
            {
              modifiers: platformizeModifiers(
                t.modifiers
              ) as unknown as string[],
              key: t.key,
            },
            activeMods,
            aKey,
            {
              strictModifierMatch: true,
              allowKeyOnly: false,
              platformize: true,
            }
          )
        )
        if (hit) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation?.()
          listenerActive = true
          armTriggers = null
          return
        }
      } catch {}
    }

    if (!inside) return

    const modF =
      (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') &&
      (e.metaKey || e.ctrlKey)
    if (modF) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
      if (document.activeElement !== inputEl) {
        inputEl?.focus()
        return
      }
      listenerActive = !listenerActive
      return
    }
    if (
      e.key === 'Backspace' &&
      !listenerActive &&
      String(search || '').trim() === ''
    ) {
      if (activeKey) {
        activeKeysStore?.clearActiveKey()
        activeKey = ''
      } else if ((activeModifiers?.length || 0) > 0) {
        if (activeKeysStore) {
          const current = sortModifiers(
            unconvertModifiers(activeKeysStore.ActiveModifiers)
          )
          current.pop()
          activeKeysStore.ActiveModifiers = convertModifiers(current)
          activeModifiers = current
        }
      }
      refilter()
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      moveSelection(1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      moveSelection(-1)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      moveSelection(e.shiftKey ? -1 : 1)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (autoRun) runSelected()
      return
    }
  }
  function onKeyupGlobal(e: KeyboardEvent) {
    if (!rootEl || !listenerActive) return
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation?.()
    try {
      activeKeysStore?.handlePhysicalKeyUp(e, { inActiveView: true })
    } catch {
      // ignore key handling errors
    }
    // Reflect cleared key/modifiers immediately
    activeKey = activeKeysStore?.ActiveKey || ''
    activeModifiers = unconvertModifiers(
      activeKeysStore?.ActiveModifiers || []
    )
    refilter()
  }

  // UI helpers
  function clearSearch() {
    if (search.trim() === '') {
      activeKeysStore?.reset()
      activeKey = ''
      activeModifiers = []
    } else {
      search = ''
    }
    refilter()
    inputEl?.focus()
  }
  // React to double-run command activation to enable listener
  let lastListenNonce = $state(0)
  $effect(() => {
    const n = Number(listenToggle || 0)
    if (!Number.isFinite(n)) return
    if (n > 0 && n !== lastListenNonce) {
      lastListenNonce = n
      listenerActive = true
      queueMicrotask(() => inputEl?.focus())
    }
  })

  function toggleListener() {
    listenerActive = !listenerActive
    inputEl?.focus()
  }
  function onInput() {
    refilter()
  }
  function onInputKeydown(e: KeyboardEvent) {
    const modF =
      (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') &&
      (e.metaKey || e.ctrlKey)
    if (modF) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
      listenerActive = !listenerActive
      return
    }
    if (listenerActive && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      listenerActive = false
      return
    }
    if (
      e.key === 'Backspace' &&
      !listenerActive &&
      String(search || '').trim() === ''
    ) {
      if (activeKey) {
        ;(activeKeysStore as any)?.clearActiveKey?.()
        activeKey = ''
      } else if ((activeModifiers?.length || 0) > 0) {
        const mods = [
          ...(((activeKeysStore as any)
            ?.sortedModifiers as unknown as string[]) || []),
        ]
        mods.pop()
        ;(activeKeysStore as any).ActiveModifiers = mods
        activeModifiers = mods
      }
      refilter()
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // Note: no reactive effects here to avoid nested update loops.
  function openFull(mode: boolean | 'split') {
    void plugin.addShortcutsView(mode)
    onClose?.({ restoreFocus: false, reason: 'open-full' })
  }
  function openFullByModifiers(e: MouseEvent) {
    const mod = e.ctrlKey || e.metaKey
    const alt = e.altKey
    if (mod && alt) return openFull('split')
    if (mod) return openFull(true)
    return openFull(false)
  }

  // Minimal filter dropdown (collapsed)
  let filtersOpen = $state(false)
  import type { CGroupFilterSettings } from '../managers/settingsManager'
  import { FilterSettingsKeyValues } from '../managers/settingsManager/keys'
  const filterKeys: Array<{ key: keyof CGroupFilterSettings; label: string }> =
    [
      {
        key: FilterSettingsKeyValues.StrictModifierMatch as keyof CGroupFilterSettings,
        label: 'Strict modifiers',
      },
      {
        key: FilterSettingsKeyValues.ViewWOhotkeys as keyof CGroupFilterSettings,
        label: 'Only with hotkeys',
      },
      {
        key: FilterSettingsKeyValues.OnlyDuplicates as keyof CGroupFilterSettings,
        label: 'Only duplicates',
      },
      {
        key: FilterSettingsKeyValues.DisplayInternalModules as keyof CGroupFilterSettings,
        label: 'Include internal modules',
      },
    ]
  function setFilter(key: keyof CGroupFilterSettings, val: boolean) {
    const patch: Partial<CGroupFilterSettings> = { [key]: val } as Partial<
      CGroupFilterSettings
    >
    groupManager.updateGroupFilterSettings(selectedGroup, patch)
    refilter()
  }

  // Mount/teardown
  const onScroll = () => recomputePosition()
  let ro: ResizeObserver | null = null
  onMount(() => {
    logger.debug('[qv] mount', { anchorExists: !!anchorEl })

    // Set up floating-ui reference element
    if (anchorEl) {
      floating.elements.reference = anchorEl
      logger.debug('[qv] floating-ui reference set')
    }

    try {
      visualKeyboardManager = new VisualKeyboardManager()
      activeKeysStore = new ActiveKeysStore(plugin.app, visualKeyboardManager)
      logger.debug('[qv] stores initialized')
    } catch (err) {
      logger.error('[qv] failed to init stores', err)
    }
    // Hotkey override scope: ensure Mod+F is captured while popover is hovered/focused
    try {
      keyScope = new Scope(plugin.app.scope)
      keyScope.register(['Mod'], 'F', (evt: KeyboardEvent) => {
        try {
          evt?.preventDefault?.()
          evt?.stopPropagation?.()
          // Focus-first rule: focus input first; toggle only when already focused
          if (document.activeElement !== inputEl) {
            inputEl?.focus()
          } else {
            listenerActive = !listenerActive
          }
        } catch {}
        return true
      })
    } catch (err) {
      logger.error('[qv] key scope init failed', err)
    }
    // No auto-activation via legacy listenToggle; replaced by armTriggers flow
    try {
      const w = Number(settingsManager.settings.quickViewWidth || 380)
      const h = Number(settingsManager.settings.quickViewHeight || 360)
      coords = {
        ...coords,
        width: Math.max(430, Math.min(520, Number.isFinite(w) ? w : 380)),
        height: Math.max(240, Number.isFinite(h) ? h : 360),
      }
      logger.debug('[qv] size from settings', coords)
    } catch (err) {
      logger.error('[qv] read size settings failed', err)
    }
    try {
      // Load persisted autoRun behavior
      autoRun = !!settingsManager.settings.quickViewAutoRun
    } catch (err) {
      logger.error('[qv] read quickViewAutoRun failed', err)
    }
    try {
      refilter()
    } catch (err) {
      logger.error('[qv] refilter on mount failed', err)
    }
    try {
      scheduleRecompute()
    } catch (err) {
      logger.error('[qv] recompute on mount failed', err)
    }
    window.addEventListener('resize', scheduleRecompute)
    document.addEventListener('scroll', onScroll, true)
    // Disable ResizeObserver to avoid render/measure feedback loops
    // (We rely on explicit window resize + scroll + pointer resize handling.)
    window.addEventListener('keydown', onKeydownGlobal, true)
    window.addEventListener('keyup', onKeyupGlobal, true)
    queueMicrotask(() => inputEl?.focus())
    mounted = true
  })
  onDestroy(() => {
    window.removeEventListener('resize', recomputePosition)
    document.removeEventListener('scroll', onScroll, true)
    ro?.disconnect()
    ro = null
    window.removeEventListener('keydown', onKeydownGlobal, true)
    window.removeEventListener('keyup', onKeyupGlobal, true)
    window.removeEventListener('pointermove', onCornerMove, true)
    window.removeEventListener('pointerup', onCornerUp, true)
    window.removeEventListener('pointermove', onLeftMove, true)
    window.removeEventListener('pointerup', onLeftUp, true)
    try {
      if (keyScope) plugin.app.keymap.popScope(keyScope)
    } catch {}
  })

  // Persist selected group id with debounce to avoid save churn
  let lastPersistedGroup = $state(
    (settingsManager.getSetting('lastOpenedGroupId') as string) || 'all'
  )
  let persistGroupTimer: ReturnType<typeof setTimeout> | null = null
  $effect(() => {
    const gid = selectedGroup
    if (!gid || gid === lastPersistedGroup) return
    if (persistGroupTimer) clearTimeout(persistGroupTimer)
    persistGroupTimer = setTimeout(() => {
      try {
        settingsManager.updateSettings({ lastOpenedGroupId: gid })
        lastPersistedGroup = gid
      } catch (err) {
        logger.error('[qv] persist lastOpenedGroupId failed', err)
      }
    }, 200)
  })
</script>

{#if mounted}
  <div
    class="qv"
    class:is-above={placeAbove}
    style="position: fixed; top:{coords.top}px; left:{coords.left}px; width:{coords.width}px; height:{Math.min(
      coords.height,
      Math.floor((window.innerHeight || 600) * 0.6)
    )}px;"
    use:clickOutside
    onclick_outside={() => {
      if (Date.now() < suppressOutsideCloseUntil) return
      if (!pinned) onClose?.({ restoreFocus: true, reason: 'click-outside' })
    }}
    role="dialog"
    tabindex="-1"
    aria-label="Quick Commands"
    bind:this={rootEl}
    onmouseenter={() => {
      try {
        if (keyScope) plugin.app.keymap.pushScope(keyScope)
      } catch {}
    }}
    onmouseleave={() => {
      try {
        if (keyScope) plugin.app.keymap.popScope(keyScope)
      } catch {}
    }}
  >
    <div class="qv-corner" title="Resize" onpointerdown={onCornerDown}></div>
    <div class="qv-left" title="Resize width" onpointerdown={onLeftDown}></div>

    <header class="qv-header">
      <div class="qv-row-1">
        <div class="qv-group-wrapper">
          <GroupSelector
            {plugin}
            bind:selectedGroup
            compact
            onChange={() => refilter()}
          />
        </div>
        <div class="spacer"></div>
        <div class="qv-actions">
          <button
            class="qv-btn"
            onclick={() => (filtersOpen = !filtersOpen)}
            aria-expanded={filtersOpen}>Filters</button
          >
          <div class="sep"></div>
          <button
            class={`qv-btn ${pinned ? 'is-on' : ''}`}
            title={pinned
              ? 'Unpin popover'
              : 'Pin popover to prevent auto-close'}
            aria-pressed={pinned}
            onclick={() => (pinned = !pinned)}
          >
            Pin
          </button>
          <div class="sep"></div>
          <button
            class="qv-btn"
            title="Open view (Ctrl=new, Ctrl+Alt=split)"
            onclick={openFullByModifiers}>Open</button
          >
          <div class="sep"></div>
          <button
            class={`qv-btn ${autoRun ? 'is-on' : ''}`}
            title={autoRun
              ? 'Click/Enter runs command'
              : 'Select only; no run on Enter/click'}
            onclick={() => {
              autoRun = !autoRun
              try {
                settingsManager.updateSettings({ quickViewAutoRun: autoRun })
              } catch (err) {
                logger.error('[qv] persist quickViewAutoRun failed', err)
              }
            }}
          >
            Run
          </button>
        </div>
      </div>
      {#if filtersOpen}
        <div class="qv-filters">
          {#each filterKeys as f}
            {#key selectedGroup}
              <label class="qv-filter">
                <input
                  type="checkbox"
                  checked={groupManager.getGroupSettings(selectedGroup)[f.key]}
                  onchange={(e: Event) =>
                    setFilter(f.key, (e.target as HTMLInputElement).checked)}
                />
                {f.label}
              </label>
            {/key}
          {/each}
        </div>
      {/if}
      <div
        class="search-wrapper"
        class:is-focused={document.activeElement === inputEl}
        role="group"
      >
        <div class="modifiers-wrapper">
          {#each sortModifiers(unconvertModifiers(activeKeysStore?.ActiveModifiers || [])) as m}
            <kbd
              class="modifier setting-hotkey"
              role="button"
              tabindex="0"
              onclick={() => {
                try {
                  activeKeysStore?.handleKeyClick(unconvertModifier(m))
                  activeModifiers = sortModifiers(
                    unconvertModifiers(activeKeysStore?.ActiveModifiers || [])
                  )
                  activeKey = activeKeysStore?.ActiveKey || ''
                } catch {}
                refilter()
              }}
              onkeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  try {
                    activeKeysStore?.handleKeyClick(unconvertModifier(m))
                    activeModifiers = sortModifiers(
                      unconvertModifiers(
                        activeKeysStore?.ActiveModifiers || []
                      )
                    )
                    activeKey = activeKeysStore?.ActiveKey || ''
                  } catch {}
                  refilter()
                }
              }}
            >
              {settingsManager.settings.useBakedKeyNames
                ? getBakedModifierLabel(m)
                : m}
            </kbd>
          {/each}
          {#if activeKey}
            <kbd
              class="modifier setting-hotkey"
              role="button"
              tabindex="0"
              onclick={() => {
                try {
                  activeKeysStore?.handleKeyClick(activeKey)
                } catch {}
                activeModifiers = sortModifiers(
                  unconvertModifiers(activeKeysStore?.ActiveModifiers || [])
                )
                activeKey = activeKeysStore?.ActiveKey || ''
                refilter()
              }}
              onkeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  try {
                    activeKeysStore?.handleKeyClick(activeKey)
                  } catch {}
                  activeModifiers = sortModifiers(
                    unconvertModifiers(activeKeysStore?.ActiveModifiers || [])
                  )
                  activeKey = activeKeysStore?.ActiveKey || ''
                  refilter()
                }
              }}
            >
              {settingsManager.settings.useBakedKeyNames
                ? getBakedKeyLabel(activeKey)
                : activeKey}
            </kbd>
          {/if}
        </div>
        <div class="hotkey-search-container">
          <input
            type="text"
            placeholder="Filter..."
            bind:value={search}
            bind:this={inputEl}
            oninput={onInput}
            onkeydown={onInputKeydown}
          />
          <div class="meta-search-wrapper">
            <button
              class={`keyboard-icon icon ${listenerActive ? 'pulse' : ''}`}
              aria-label={listenerActive
                ? 'Press Esc to deactivate key listener'
                : `Press ${convertModifiers(['Mod'])[0]}+F or long press to activate key listener`}
              aria-pressed={listenerActive}
              title={listenerActive
                ? 'Deactivate key listener (Esc)'
                : 'Activate key listener'}
              onclick={toggleListener}
            >
              <CircleDotIcon size={16} />
            </button>
            <button
              class="clear-icon icon"
              aria-label="Clear text or reset keys"
              title="Clear text or reset keys"
              onclick={clearSearch}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>

    <div
      class="qv-list"
      bind:this={listEl}
      role="listbox"
      aria-label="Command results"
    >
      {#if filtered.length === 0}
        <div class="qv-empty">No matching commands</div>
      {:else}
        {#each filtered as cmd, i (cmd.id)}
          <div
            class="qv-row {i === selectedIndex ? 'is-selected' : ''}"
            role="option"
            tabindex="0"
            aria-selected={i === selectedIndex}
            onclick={() => {
              selectedIndex = i
              if (autoRun) runSelected()
            }}
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectedIndex = i
                if (autoRun) runSelected()
              }
            }}
          >
            <div class="qv-name">{cmd.name}</div>
            <div class="qv-hotkeys">
              {#each cmd.hotkeys as hk}
                <span class="hk"
                  >{settingsManager.settings.useBakedKeyNames
                    ? formatHotkeyBaked(hk)
                    : plugin.hotkeyManager.renderHotkey(hk)}</span
                >
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .qv {
    min-width: 430px;
    /* width is clamped in code */
    min-height: 220px;
    /* height is clamped in code to ~60vh */
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
    z-index: 180000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* Search row parity with SearchMenu, scoped to popover */
  .qv .search-wrapper {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-normal);
    padding: 8px 12px;
    margin: 8px 0 0 0;
    background: transparent;
    position: relative;
  }
  .qv .search-wrapper.is-focused {
    border: 1px solid var(--interactive-accent);
    box-shadow: 0px 0px 0px 3px var(--color-d-gray-60);
  }
  .qv .modifiers-wrapper {
    display: flex;
    width: fit-content;
    flex-direction: row;
    flex-wrap: wrap;
    flex-shrink: 1;
    align-content: center;
    margin-right: 8px;
  }
  .qv kbd.modifier.setting-hotkey {
    padding: 2px 6px;
    margin-right: 4px;
    margin-bottom: 2px;
    border: 1px solid var(--indentation-guide);
    background-color: var(--background-secondary-alt);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .qv kbd.modifier.setting-hotkey:hover {
    background-color: var(--interactive-hover);
  }
  .qv .hotkey-search-container {
    position: relative;
    flex: 1 1 auto;
  }
  .qv .hotkey-search-container input {
    height: 34px;
    width: 100%;
    font-size: 14px;
    padding: 0 48px 0 0;
    margin: 0;
    border: none !important;
    border-radius: 0;
    background: transparent;
    color: var(--text-normal);
    box-shadow: none;
  }
  .qv .hotkey-search-container input:active {
    background: transparent !important;
    box-shadow: none !important;
  }
  .qv .meta-search-wrapper {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .qv .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    color: var(--text-muted);
  }
  .qv .icon:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .qv .keyboard-icon.pulse {
    /* Subtle glow without layout shift */
    color: var(--text-on-accent);
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    animation: qv-glow 1200ms ease-in-out infinite alternate;
  }
  @keyframes qv-glow {
    from {
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
      opacity: 0.95;
    }
    to {
      box-shadow: 0 0 8px 2px
        color-mix(in oklab, var(--interactive-accent), transparent 50%);
      opacity: 1;
    }
  }
  .qv-header {
    padding: 8px;
    border-bottom: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
  }
  .qv-row-1 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .qv-group-wrapper {
    display: flex;
    align-items: center;
  }
  .spacer {
    flex: 1 1 auto;
  }
  .qv-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .qv-btn {
    font-size: 12px;
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
  }
  .qv-btn:hover {
    background: var(--background-modifier-hover);
  }
  .qv-btn.is-on {
    color: var(--text-on-accent);
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
  }
  .sep {
    width: 1px;
    height: 16px;
    background: var(--background-modifier-border);
    margin: 0 4px;
  }
  .qv-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 8px 2px 4px;
  }
  .qv-filter {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .qv-search {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chips {
    display: flex;
    gap: 4px;
    align-items: center;
    min-height: 20px;
  }
  .chip {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 11px;
    cursor: pointer;
  }
  .qv-input {
    flex: 1 1 auto;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
  }
  .qv-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .qv-list {
    flex: 1 1 auto;
    overflow: auto;
    padding: 6px;
  }
  .qv-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
  }
  .qv-row:hover {
    background: var(--background-modifier-hover);
  }
  .qv-row.is-selected {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }
  .qv-name {
    flex: 1 1 auto;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .qv-hotkeys {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .hk {
    font-size: 11.5px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    text-wrap: nowrap;
    padding: 2px 6px;
  }

  .qv-left {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    border-right: 1px solid var(--background-modifier-border);
    background: linear-gradient(
      to right,
      color-mix(in oklab, var(--background-modifier-border), transparent 70%),
      transparent
    );
  }
  .qv-left:hover {
    background: linear-gradient(
      to right,
      color-mix(in oklab, var(--background-modifier-border), transparent 50%),
      transparent
    );
  }
  .qv-corner {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
    background: linear-gradient(
      135deg,
      color-mix(in oklab, var(--background-modifier-border), transparent 40%),
      transparent 65%
    );
    border-top-left-radius: 8px;
  }
  .qv-corner:hover {
    background: linear-gradient(
      135deg,
      color-mix(in oklab, var(--background-modifier-border), transparent 25%),
      transparent 65%
    );
  }
</style>
