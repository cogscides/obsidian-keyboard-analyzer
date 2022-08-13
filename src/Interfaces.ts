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

export type KeyLiteral = {
  symbol: string
}

export type KeyProperty = {
  property: any
  value: number
}

export type Key = {
  color?: string
  label?: string
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
  default?: {
    textColor: string
    textSize: string
  }
}

export type Row = Key[] | Array<Key[]>

export type KeyboardInterface = Row[]

// export interface KeyboardLayoutJSON extends Array<KeyTypes> {
// itemList: KeyObj[]
// }

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
// export type KeyTypes = KeyLiteral | KeyProperty

// export interface KayboardLayoutResults {
//   hover:
// }
