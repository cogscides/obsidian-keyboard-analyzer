import type { Hotkey, Modifier } from 'obsidian'

// Plugin Settings
export interface FilterSettings {
  FeaturedFirst: boolean
  StrictSearch: boolean
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

// Plugin Data
export interface hotkeyEntry extends Omit<Hotkey, 'modifiers'> {
  modifiers: Modifier[]
  backedModifiers?: string
  isCustom: boolean
}

export interface commandEntry {
  id: string
  pluginName: string
  cmdName: string
  hotkeys: hotkeyEntry[] | []
}

export interface hotkeyDict {
  [id: string]: commandEntry
}

export type commandsArray = commandEntry[]

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
