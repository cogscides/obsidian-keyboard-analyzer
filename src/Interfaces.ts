export interface KeyboardAnalizerSettings {
  showStatusBarItem: string
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

export interface KeyboardLayoutJSON extends Array<KeyTypes> {
  // itemList: KeyObj[]
}

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
export type KeyTypes = KeyLiteral | KeyProperty

// export interface KayboardLayoutResults {
//   hover:
// }
