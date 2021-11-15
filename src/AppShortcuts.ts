import type { Command } from 'obsidian'

const getNestedObject = (nestedObj: any, pathArr: Array<string>) => {
  return pathArr.reduce(
    (obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined),
    nestedObj
  )
}

function hilite(keys: Array<string>, how: Object) {
  // need to check if existing key combo is overridden by undefining it
  if (keys && keys[1][0] !== undefined) {
    return how + keys.flat(2).join('+').replace('Mod', 'Ctrl') + how
  } else {
    return how + '–' + how
  }
}

// function getHotkey(arr: Array<Hotkey>): string {}, highlight = true) {
//   let hi = highlight ? '**' : ''
//   let defkeys = arr.hotkeys
//     ? [
//         [getNestedObject(arr.hotkeys, [0, 'modifiers'])],
//         [getNestedObject(arr.hotkeys, [0, 'key'])],
//       ]
//     : undefined
//   let ck = app.hotkeyManager.customKeys[arr.id]
//   var hotkeys = ck
//     ? [
//         [getNestedObject(ck, [0, 'modifiers'])],
//         [getNestedObject(ck, [0, 'key'])],
//       ]
//     : undefined
//   return hotkeys ? hilite(hotkeys, hi) : hilite(defkeys, '')
// }

//@ts-ignore
export function getCommands(app: App) {
  const commands: Command[] = Object.values(app.commands.commands)
  console.log(commands)

  return commands
}

// export const commands: Command[] = Object.values(this.app.commands.commands)
