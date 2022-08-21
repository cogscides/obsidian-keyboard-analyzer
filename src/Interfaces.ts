import type { Hotkey, Modifier } from 'obsidian'

export interface FilterSettings {
  FeaturedFirst: boolean
  HighlightCustom: boolean
  HighlightDuplicates: boolean
  DisplayWOhotkeys: boolean
  DisplayIDs: boolean
}

export interface PluginSettings {
  showStatusBarItem: boolean
  filterSettings: FilterSettings
  featuredCommandIDs?: string[]
}

export interface hotkeyEntry {
  modifiers: Modifier[]
  key: string
  backedModifiers?: string
  isCustom?: boolean
}

export interface commandEntry {
  id: string
  pluginName: string
  cmdName: string
  hotkeys: hotkeyEntry[]
}

export interface commandsArray extends Array<commandEntry> {}

export interface hotkeyDict {
  [id: string]: commandEntry
}

export interface Key {
  label: string
  color?: string
  fontSize?: string
  smallText?: boolean
  caps?: string
  strictCode?: boolean
  tryUnicode?: boolean
  width?: number
  height?: number
}

export type Row = Key[]

export interface KeyboardSection {
  name: string
  rows: Row[]
  gridRatio: number
}

export type Keyboard = KeyboardSection[]
