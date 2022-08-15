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

// export interface KeyObj {
//   key: any
// }

export interface Key {
  color?: string
  label?: string
  fontSize?: string
  caps?: string
  output?: string | null
  // textColor: Array<string | undefined> = [];
  // textSize: Array<number | undefined> = [];
  // default: { textColor: string; textSize: number } = {
  //   textColor: "#000000",
  //   textSize: 3
  // };
  width?: number
  height?: number
  x?: number
  y?: number
}

export type Row = Key[]

export interface KeyboardSection {
  name: string
  rows: Row[]
  gridRatio: number
}

export type Keyboard = KeyboardSection[]
