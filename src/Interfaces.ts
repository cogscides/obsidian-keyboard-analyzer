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

export type Key = {
  color: string
  label: string
  output: string
  // textColor: Array<string | undefined> = [];
  // textSize: Array<number | undefined> = [];
  // default: { textColor: string; textSize: number } = {
  //   textColor: "#000000",
  //   textSize: 3
  // };
  x: number
  y: number
  width: number
  height: number
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
