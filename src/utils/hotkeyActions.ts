import type { App } from 'obsidian'
import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
import type CommandsManager from '../managers/commandsManager'
import { normalizeKey, sortModifiers, canonicalizeModifiersForPersist } from './modifierUtils'
import { writable, get } from 'svelte/store'
import logger from './logger'

export type SimpleHotkey = { modifiers: string[]; key: string }

type UndoEntry = {
  id: string
  prevCustom: SimpleHotkey[] | null | undefined
}

// Store the last change for quick undo. Keep only one-level undo for simplicity.
const lastChangeStore = writable<UndoEntry | null>(null)
export const lastHotkeyChange = lastChangeStore
// Append-only, in-memory log of applied hotkey changes for the banner (most recent first)
export const changeLogStore = writable<string[]>([])
// Revert buffer: commands with changes we can revert (id -> previous custom state)
export type RevertEntry = { id: string; prevCustom: SimpleHotkey[] | null; name?: string }
export const revertBufferStore = writable<Map<string, RevertEntry>>(new Map())

function toSimple(hk: hotkeyEntry): SimpleHotkey {
  const mods = sortModifiers((hk.modifiers as unknown as string[]) || [])
  return { modifiers: mods, key: normalizeKey(hk.key || '') }
}

function toSimpleArray(hotkeys: hotkeyEntry[] | undefined): SimpleHotkey[] {
  return (hotkeys || []).map(toSimple)
}

function makeSimple(mods: string[] | string, key: string): SimpleHotkey {
  const arr = Array.isArray(mods) ? mods : (mods || '').split(',').filter(Boolean)
  const sorted = sortModifiers(arr)
  return { modifiers: sorted, key: normalizeKey(key || '') }
}

function persistedSig(h: SimpleHotkey): string {
  const mods = canonicalizeModifiersForPersist(h.modifiers)
  return `${mods.join(',')}|${normalizeKey(h.key)}`
}

function chordToStr(h: SimpleHotkey): string {
  const mods = h.modifiers || []
  const key = normalizeKey(h.key || '')
  return `${mods.length ? mods.join('+') + '+' : ''}${key}`
}

function chordToPersistedStr(h: SimpleHotkey): string {
  const mods = canonicalizeModifiersForPersist(h.modifiers || [])
  const key = normalizeKey(h.key || '')
  return `${mods.length ? mods.join('+') + '+' : ''}${key}`
}

function listToStr(list: SimpleHotkey[], persisted = false): string {
  const f = persisted ? chordToPersistedStr : chordToStr
  return `[${(list || []).map(f).join(', ')}]`
}

function uppercaseIfLetter(key: string): string {
  const k = normalizeKey(key || '')
  if (k.length === 1 && k >= 'a' && k <= 'z') return k.toUpperCase()
  return k
}

export function hasAPIs(app: App): {
  set: boolean
  remove: boolean
  save: boolean
  bake: boolean
} {
  const hm = (app as unknown as { hotkeyManager?: unknown }).hotkeyManager as any
  return {
    set: !!hm && typeof hm.setHotkeys === 'function',
    remove: !!hm && typeof hm.removeHotkeys === 'function',
    save: !!hm && typeof hm.save === 'function',
    bake: !!hm && typeof hm.bake === 'function',
  }
}

export async function assignHotkeyAdditive(
  app: App,
  cm: CommandsManager,
  id: string,
  newHotkey: { modifiers: string[]; key: string }
): Promise<void> {
  const apis = hasAPIs(app)
  if (!apis.set || !apis.save || !apis.bake) throw new Error('Hotkey APIs unavailable')
  const hm = (app as any).hotkeyManager

  const index = cm.getCommandsIndex()
  const entry: commandEntry | undefined = index[id]
  const prevCustom = entry?.customHotkeys ? toSimpleArray(entry.customHotkeys) : []
  const prevCustomOrNull = prevCustom.length ? prevCustom : null

  const defaultsSimple = (entry?.defaultHotkeys || []).map(toSimple)
  const newSimple: SimpleHotkey = makeSimple(newHotkey.modifiers, newHotkey.key)
  logger.debug(
    `[hotkeys] assign:start id=${id} new=${chordToStr(newSimple)} defaults=${listToStr(defaultsSimple)} custom=${listToStr(prevCustom)}`
  )

  // Build next set: if there are custom hotkeys, append to those; otherwise include defaults + new.
  const base: hotkeyEntry[] = (entry?.customHotkeys && entry.customHotkeys.length)
    ? entry.customHotkeys
    : (entry?.defaultHotkeys || [])

  // De-duplicate using canonical "persisted" signature (after Mod collapse/expansion)
  const map = new Map<string, SimpleHotkey>()
  for (const hk of base) {
    const s = toSimple(hk)
    map.set(persistedSig(s), s)
  }
  const add = makeSimple(newHotkey.modifiers, newHotkey.key)
  const addSig = persistedSig(add)

  // Note: Do NOT short-circuit when equals default — mimic Obsidian behavior by
  // writing a custom entry even if it matches defaults. This lets users explicitly
  // set/confirm the hotkey and treat it as custom.

  map.set(addSig, add)
  const next: SimpleHotkey[] = Array.from(map.values())

  // Persist with canonicalized modifiers (collapse primary → 'Mod')
  const persistedNext = next
    .map(h => ({
      modifiers: canonicalizeModifiersForPersist(h.modifiers),
      key: uppercaseIfLetter(h.key),
    }))
    // Final guard: de-dupe again post-canonicalize to avoid double entries like [Mod] vs [Meta] → [Mod]
    .reduce((acc: { modifiers: string[]; key: string }[], curr) => {
      const sig = `${curr.modifiers.join(',')}|${normalizeKey(curr.key)}`
      if (!acc.some(x => `${x.modifiers.join(',')}|${normalizeKey(x.key)}` === sig)) acc.push(curr)
      return acc
    }, [])

  logger.debug(
    `[hotkeys] assign:apply id=${id} add=${chordToStr(add)} next=${listToStr(next)} persisted=${listToStr(persistedNext as any, true)}`
  )

  hm.setHotkeys(id, persistedNext)
  hm.save()
  if (typeof hm.load === 'function') hm.load()
  hm.bake()

  // Push undo entry
  lastChangeStore.set({ id, prevCustom: prevCustomOrNull })
  try {
    const name = (cm.getCommandsIndex()[id]?.name || id)
    changeLogStore.update(arr => [`${chordToStr(add)} — ${name}`, ...arr].slice(0, 20))
    revertBufferStore.update(map => {
      const next = new Map(map)
      next.set(id, { id, prevCustom: prevCustomOrNull, name })
      return next
    })
  } catch {}

  // Refresh our view of commands
  cm.refreshIndex()
}

export async function restoreDefaults(
  app: App,
  cm: CommandsManager,
  id: string
): Promise<void> {
  const apis = hasAPIs(app)
  if (!apis.remove || !apis.save || !apis.bake) throw new Error('Hotkey APIs unavailable')
  const hm = (app as any).hotkeyManager

  const index = cm.getCommandsIndex()
  const entry: commandEntry | undefined = index[id]
  const prevCustom = entry?.customHotkeys ? toSimpleArray(entry.customHotkeys) : []
  const prevCustomOrNull = prevCustom.length ? prevCustom : null

  logger.debug(
    `[hotkeys] restore:start id=${id} prevCustom=${listToStr(prevCustom)}`
  )
  hm.removeHotkeys(id)
  hm.save()
  if (typeof hm.load === 'function') hm.load()
  hm.bake()

  lastChangeStore.set({ id, prevCustom: prevCustomOrNull })
  cm.refreshIndex()
  logger.info(`[hotkeys] restore:done id=${id}`)
  try {
    const name = (cm.getCommandsIndex()[id]?.name || id)
    changeLogStore.update(arr => [`defaults — ${name}`, ...arr].slice(0, 20))
    revertBufferStore.update(map => {
      const next = new Map(map)
      next.set(id, { id, prevCustom: prevCustomOrNull, name })
      return next
    })
  } catch {}
}

/** Remove a single hotkey from a command (per-chip delete). */
export async function removeHotkeySingle(
  app: App,
  cm: CommandsManager,
  id: string,
  toRemove: { modifiers: string[]; key: string } | hotkeyEntry
): Promise<void> {
  const apis = hasAPIs(app)
  if (!apis.set || !apis.save || !apis.bake) throw new Error('Hotkey APIs unavailable')
  const hm = (app as any).hotkeyManager

  const index = cm.getCommandsIndex()
  const entry: commandEntry | undefined = index[id]
  const prevCustom = entry?.customHotkeys ? toSimpleArray(entry.customHotkeys) : []
  const prevCustomOrNull = prevCustom.length ? prevCustom : null

  const defaults = (entry?.defaultHotkeys || []).map(toSimple)
  const base: SimpleHotkey[] = (entry?.customHotkeys && entry.customHotkeys.length)
    ? toSimpleArray(entry.customHotkeys)
    : defaults

  const target = 'modifiers' in toRemove ? makeSimple((toRemove as any).modifiers, (toRemove as any).key) : toSimple(toRemove as hotkeyEntry)
  const targetKey = persistedSig(target)

  const map = new Map<string, SimpleHotkey>()
  for (const hk of base) {
    const sig = persistedSig(hk)
    if (sig !== targetKey) map.set(sig, hk)
  }
  const next = Array.from(map.values())

  // If next equals defaults, prefer removing custom entry entirely
  const defaultsSig = defaults.map(h => persistedSig(h)).sort()
  const nextSig = next.map(h => persistedSig(h)).sort()
  const equalsDefaults = defaultsSig.length === nextSig.length && defaultsSig.every((v, i) => v === nextSig[i])

  logger.debug(
    `[hotkeys] remove:start id=${id} target=${chordToStr(target)} base=${listToStr(base)} next=${listToStr(next)} equalsDefaults=${String(equalsDefaults)}`
  )

  if (equalsDefaults) {
    if (!apis.remove) throw new Error('Remove API unavailable')
    hm.removeHotkeys(id)
  } else {
    const persistedNext = next
      .map(h => ({
        modifiers: canonicalizeModifiersForPersist(h.modifiers),
        key: uppercaseIfLetter(h.key),
      }))
      .reduce((acc: { modifiers: string[]; key: string }[], curr) => {
        const sig = `${curr.modifiers.join(',')}|${normalizeKey(curr.key)}`
        if (!acc.some(x => `${x.modifiers.join(',')}|${normalizeKey(x.key)}` === sig)) acc.push(curr)
        return acc
      }, [])
    hm.setHotkeys(id, persistedNext)
  }
  hm.save()
  if (typeof hm.load === 'function') hm.load()
  hm.bake()

  lastChangeStore.set({ id, prevCustom: prevCustomOrNull })
  cm.refreshIndex()
  logger.info(`[hotkeys] remove:done id=${id}`)
  try {
    const name = (cm.getCommandsIndex()[id]?.name || id)
    changeLogStore.update(arr => [`− ${chordToStr(target)} — ${name}`, ...arr].slice(0, 20))
    revertBufferStore.update(map => {
      const next = new Map(map)
      next.set(id, { id, prevCustom: prevCustomOrNull, name })
      return next
    })
  } catch {}
}

export async function undoLastChange(app: App, cm: CommandsManager): Promise<boolean> {
  let undone = false
  const snapshot: UndoEntry | null = get(lastChangeStore)
  lastChangeStore.set(null)
  if (!snapshot) return false

  const apis = hasAPIs(app)
  if (!apis.save || !apis.bake) return false
  const hm = (app as any).hotkeyManager

  if (snapshot.prevCustom && snapshot.prevCustom.length) {
    hm.setHotkeys(snapshot.id, snapshot.prevCustom)
  } else {
    if (!apis.remove) return false
    hm.removeHotkeys(snapshot.id)
  }
  hm.save()
  if (typeof hm.load === 'function') hm.load()
  hm.bake()
  cm.refreshIndex()
  undone = true
  try {
    const name = (cm.getCommandsIndex()[snapshot.id]?.name || snapshot.id)
    changeLogStore.update(arr => [`undo — ${name}`, ...arr].slice(0, 20))
    revertBufferStore.update(map => {
      const next = new Map(map)
      next.delete(snapshot!.id)
      return next
    })
  } catch {}
  return undone
}

/** Revert a specific command back to its pre-change custom state from the buffer. */
export async function revertChangeForId(app: App, cm: CommandsManager, id: string): Promise<boolean> {
  const apis = hasAPIs(app)
  if (!apis.save || !apis.bake) return false
  let entry: RevertEntry | undefined
  revertBufferStore.update(map => {
    entry = map.get(id)
    return map
  })
  if (!entry) return false
  const hm = (app as any).hotkeyManager
  if (entry.prevCustom && entry.prevCustom.length) {
    hm.setHotkeys(id, entry.prevCustom)
  } else {
    if (!apis.remove) return false
    hm.removeHotkeys(id)
  }
  hm.save()
  if (typeof hm.load === 'function') hm.load()
  hm.bake()
  cm.refreshIndex()
  // Remove from buffer and log
  revertBufferStore.update(map => {
    const next = new Map(map)
    next.delete(id)
    return next
  })
  try {
    const name = (cm.getCommandsIndex()[id]?.name || id)
    changeLogStore.update(arr => [`revert — ${name}`, ...arr].slice(0, 20))
  } catch {}
  return true
}
