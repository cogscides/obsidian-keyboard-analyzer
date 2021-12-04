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

export type Row = Key[] | Array<Row> | Key

export type Keyboard = Row[] | Key

// export interface KeyboardLayoutJSON extends Array<KeyTypes> {
// itemList: KeyObj[]
// }

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
// export type KeyTypes = KeyLiteral | KeyProperty

// export interface KayboardLayoutResults {
//   hover:
// }
